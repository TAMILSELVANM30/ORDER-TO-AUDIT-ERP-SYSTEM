from decimal import Decimal

# Normalized base conversion factors:
# Base units: WEIGHT -> grams ('g'), VOLUME -> millilitres ('ml'), COUNT -> pieces ('piece')

UNIT_CATEGORIES = {
    'kg': ('WEIGHT', Decimal('1000.0')),
    'g': ('WEIGHT', Decimal('1.0')),
    'gram': ('WEIGHT', Decimal('1.0')),
    'litre': ('VOLUME', Decimal('1000.0')),
    'l': ('VOLUME', Decimal('1000.0')),
    'ml': ('VOLUME', Decimal('1.0')),
    'piece': ('COUNT', Decimal('1.0')),
    'packet': ('COUNT', Decimal('1.0')),
    'carton': ('COUNT', Decimal('20.0')), # 1 carton = 20 packets/pieces in benchmark
}

def normalize_unit(unit_str: str) -> str:
    if not unit_str:
        return 'piece'
    u = unit_str.strip().lower()
    if u in ('kg', 'kgs', 'kilogram', 'kilograms'):
        return 'kg'
    if u in ('g', 'gm', 'gms', 'gram', 'grams'):
        return 'g'
    if u in ('l', 'litre', 'litres', 'liter', 'liters'):
        return 'litre'
    if u in ('ml', 'millilitre', 'millilitres', 'milliliter'):
        return 'ml'
    if u in ('packet', 'packets', 'pkt', 'pkts'):
        return 'packet'
    if u in ('carton', 'cartons', 'box', 'boxes'):
        return 'carton'
    if u in ('piece', 'pieces', 'pc', 'pcs'):
        return 'piece'
    return u

def convert_units(quantity: Decimal, from_unit: str, to_unit: str) -> Decimal:
    """Converts quantity between compatible units.
    Raises ValueError if units are incompatible.
    """
    from_u = normalize_unit(from_unit)
    to_u = normalize_unit(to_unit)
    
    if from_u == to_u:
        return quantity
        
    if from_u not in UNIT_CATEGORIES:
        raise ValueError(f"Unknown source unit: '{from_unit}'")
    if to_u not in UNIT_CATEGORIES:
        raise ValueError(f"Unknown destination unit: '{to_unit}'")
        
    cat_from, factor_from = UNIT_CATEGORIES[from_u]
    cat_to, factor_to = UNIT_CATEGORIES[to_u]
    
    if cat_from != cat_to:
        raise ValueError(f"Cannot convert incompatible units: '{from_unit}' ({cat_from}) to '{to_unit}' ({cat_to})")
        
    # Convert from -> base -> to
    base_qty = quantity * factor_from
    converted_qty = base_qty / factor_to
    return converted_qty
