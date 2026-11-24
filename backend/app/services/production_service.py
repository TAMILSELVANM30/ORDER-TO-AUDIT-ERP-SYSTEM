from decimal import Decimal
from datetime import datetime, timezone, date
from sqlalchemy.orm import Session
from app.models.production import ProductionRun, ProductionMaterialIssue, ProductionStatus
from app.models.bom import BOM, BOMVersion, BOMComponent
from app.models.product import Product
from app.models.material import Material
from app.models.settings import BusinessSettings
from app.services.inventory_service import InventoryService
from app.models.stock_ledger import MovementType
from app.utils.financial import to_decimal
from app.utils.audit import log_audit_event

class ProductionService:
    @staticmethod
    def calculate_planned_run(db: Session, product_id: str, bom_version_id: str, batch_size: Decimal):
        bom_ver = db.query(BOMVersion).filter_by(id=bom_version_id).first()
        if not bom_ver:
            raise ValueError("BOM Version not found.")
            
        multiplier = to_decimal(batch_size, 4) / to_decimal(bom_ver.batch_size, 4)
        expected_output = to_decimal(bom_ver.expected_yield, 2) * multiplier
        
        components_plan = []
        for comp in bom_ver.components:
            planned_qty = to_decimal(comp.standard_quantity, 4) * multiplier
            mat = comp.material
            available_stock = to_decimal(mat.current_stock, 4) if mat else Decimal('0.0000')
            cost_rate = to_decimal(mat.current_weighted_avg_cost, 4) if mat else Decimal('0.0000')
            estimated_cost = planned_qty * cost_rate
            
            components_plan.append({
                'material_id': comp.material_id,
                'material_code': mat.code if mat else '',
                'material_name': mat.name if mat else '',
                'component_type': comp.component_type,
                'unit': comp.unit,
                'standard_quantity': float(comp.standard_quantity),
                'planned_quantity': float(planned_qty),
                'available_stock': float(available_stock),
                'is_stock_sufficient': available_stock >= planned_qty,
                'unit_cost': float(cost_rate),
                'estimated_cost': float(to_decimal(estimated_cost, 2)),
            })
            
        return {
            'product_id': product_id,
            'bom_version_id': bom_version_id,
            'batch_size': float(batch_size),
            'expected_output': float(expected_output),
            'yield_unit': bom_ver.yield_unit,
            'components': components_plan
        }

    @staticmethod
    def create_production_run(
        db: Session,
        product_id: str,
        bom_version_id: str,
        batch_size: Decimal,
        production_date: date,
        actual_good_output: Decimal,
        damaged_output: Decimal,
        materials_issued: list, # [{'material_id': str, 'actual_quantity': Decimal, 'unit': str, 'component_type': str}]
        labour_cost: Decimal = Decimal('0.00'),
        gas_cost: Decimal = Decimal('0.00'),
        electricity_cost: Decimal = Decimal('0.00'),
        other_overheads: Decimal = Decimal('0.00'),
        supervisor_id: str = None,
        user_id: str = None,
        remarks: str = None
    ) -> ProductionRun:
        bom_ver = db.query(BOMVersion).filter_by(id=bom_version_id).first()
        if not bom_ver:
            raise ValueError("BOM Version not found.")
            
        settings = db.query(BusinessSettings).first()
        tolerance = to_decimal(settings.default_variance_tolerance, 2) if settings else Decimal('3.00')
        
        # Next run number
        count = db.query(ProductionRun).count()
        run_number = f"PR-{date.today().year}-{count + 1:04d}"
        
        multiplier = to_decimal(batch_size, 4) / to_decimal(bom_ver.batch_size, 4)
        expected_output = to_decimal(bom_ver.expected_yield, 2) * multiplier
        actual_good = to_decimal(actual_good_output, 2)
        damaged = to_decimal(damaged_output, 2)
        
        # Yield variance: (Actual Good Output - Expected Output) / Expected Output * 100
        if expected_output > Decimal('0.00'):
            yield_var_pct = ((actual_good - expected_output) / expected_output) * Decimal('100.00')
        else:
            yield_var_pct = Decimal('0.00')
            
        total_labour = to_decimal(labour_cost, 2)
        total_gas = to_decimal(gas_cost, 2)
        total_elec = to_decimal(electricity_cost, 2)
        total_other = to_decimal(other_overheads, 2)
        total_overhead = total_labour + total_gas + total_elec + total_other
        
        run = ProductionRun(
            run_number=run_number,
            product_id=product_id,
            bom_version_id=bom_version_id,
            production_date=production_date or date.today(),
            batch_size=to_decimal(batch_size, 2),
            expected_output=expected_output,
            actual_good_output=actual_good,
            damaged_output=damaged,
            labour_cost=total_labour,
            gas_cost=total_gas,
            electricity_cost=total_elec,
            other_overheads=total_other,
            total_overhead=total_overhead,
            yield_variance_pct=to_decimal(yield_var_pct, 2),
            status=ProductionStatus.DRAFT,
            supervisor_id=supervisor_id,
            created_by_id=user_id,
            remarks=remarks
        )
        db.add(run)
        db.flush()
        
        # Map BOM standard components for planned quantity calculation
        bom_comp_map = {c.material_id: c for c in bom_ver.components}
        
        total_mat_cost = Decimal('0.00')
        total_pack_cost = Decimal('0.00')
        
        for issue_data in materials_issued:
            mat_id = issue_data['material_id']
            act_qty = to_decimal(issue_data['actual_quantity'], 4)
            unit = issue_data.get('unit', 'kg')
            comp_type = issue_data.get('component_type', 'RAW_MATERIAL')
            
            mat = db.query(Material).filter_by(id=mat_id).first()
            if not mat:
                raise ValueError(f"Material with ID '{mat_id}' not found.")
                
            unit_cost = to_decimal(mat.current_weighted_avg_cost, 4)
            cost_val = to_decimal(act_qty * unit_cost, 2)
            
            bom_comp = bom_comp_map.get(mat_id)
            if bom_comp:
                planned_qty = to_decimal(bom_comp.standard_quantity, 4) * multiplier
            else:
                planned_qty = act_qty
                
            var_qty = act_qty - planned_qty
            if planned_qty > Decimal('0.0000'):
                var_pct = (var_qty / planned_qty) * Decimal('100.00')
            else:
                var_pct = Decimal('0.00')
                
            is_excess = var_qty > Decimal('0.0000')
            
            if comp_type == 'RAW_MATERIAL':
                total_mat_cost += cost_val
            else:
                total_pack_cost += cost_val
                
            issue_rec = ProductionMaterialIssue(
                production_run_id=run.id,
                material_id=mat_id,
                planned_quantity=planned_qty,
                actual_quantity=act_qty,
                unit=unit,
                unit_cost=unit_cost,
                total_cost=cost_val,
                variance_qty=to_decimal(var_qty, 4),
                variance_pct=to_decimal(var_pct, 2),
                is_excess=is_excess,
                component_type=comp_type
            )
            db.add(issue_rec)
            
        total_prod_cost = total_mat_cost + total_pack_cost + total_overhead
        if actual_good > Decimal('0.00'):
            cost_per_pkt = total_prod_cost / actual_good
        else:
            cost_per_pkt = Decimal('0.0000')
            
        run.total_material_cost = total_mat_cost
        run.total_packaging_cost = total_pack_cost
        run.total_production_cost = total_prod_cost
        run.cost_per_packet = to_decimal(cost_per_pkt, 4)
        
        log_audit_event(
            db, action="PRODUCTION_RUN_CREATED", entity_type="ProductionRun",
            entity_id=run.id, user_id=user_id,
            new_values={'run_number': run.run_number, 'batch_size': float(batch_size)}
        )
        db.commit()
        return run

    @staticmethod
    def post_production_run(db: Session, run_id: str, user_id: str = None) -> ProductionRun:
        run = db.query(ProductionRun).filter_by(id=run_id).with_for_update().first()
        if not run:
            raise ValueError("Production Run not found.")
        if run.status == ProductionStatus.POSTED:
            raise ValueError(f"Production Run '{run.run_number}' is already posted. Duplicate posting is prohibited.")
        if run.status == ProductionStatus.CANCELLED:
            raise ValueError("Cannot post a cancelled production run.")
            
        # Deduct all raw materials & packaging
        for issue in run.material_issues:
            InventoryService.record_material_movement(
                db=db,
                material_id=issue.material_id,
                movement_type=MovementType.PRODUCTION_ISSUE,
                quantity_in=Decimal('0.0000'),
                quantity_out=to_decimal(issue.actual_quantity, 4),
                source_doc_type="PRODUCTION_RUN",
                source_doc_id=run.run_number,
                unit=issue.unit,
                unit_cost=to_decimal(issue.unit_cost, 4),
                user_id=user_id,
                remarks=f"Production issue for run {run.run_number}"
            )
            
        # Increase finished goods stock by actual good output
        product = db.query(Product).filter_by(id=run.product_id).first()
        InventoryService.record_product_movement(
            db=db,
            product_id=run.product_id,
            movement_type=MovementType.PRODUCTION_OUTPUT,
            quantity_in=to_decimal(run.actual_good_output, 2),
            quantity_out=Decimal('0.00'),
            source_doc_type="PRODUCTION_RUN",
            source_doc_id=run.run_number,
            unit=product.uom if product else 'packet',
            unit_cost=to_decimal(run.cost_per_packet, 4),
            user_id=user_id,
            remarks=f"Production output for run {run.run_number}"
        )
        
        run.status = ProductionStatus.POSTED
        run.posted_at = datetime.now(timezone.utc)
        
        log_audit_event(
            db, action="PRODUCTION_RUN_POSTED", entity_type="ProductionRun",
            entity_id=run.id, user_id=user_id,
            new_values={
                'run_number': run.run_number,
                'actual_good_output': float(run.actual_good_output),
                'cost_per_packet': float(run.cost_per_packet),
                'total_production_cost': float(run.total_production_cost)
            }
        )
        db.commit()
        return run
