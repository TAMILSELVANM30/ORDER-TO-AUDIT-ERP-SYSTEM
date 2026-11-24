from decimal import Decimal, ROUND_HALF_UP

TWO_PLACES = Decimal('0.01')
FOUR_PLACES = Decimal('0.0001')

def to_decimal(val, places=2) -> Decimal:
    if val is None:
        return Decimal('0.00')
    if isinstance(val, Decimal):
        d = val
    else:
        d = Decimal(str(val))
    if places == 2:
        return d.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    elif places == 4:
        return d.quantize(FOUR_PLACES, rounding=ROUND_HALF_UP)
    return d

def number_to_words_inr(num) -> str:
    """Converts a monetary amount to Indian Rupee word format."""
    units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
             "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
    
    d = to_decimal(num, 2)
    rupees = int(d)
    paise = int((d - Decimal(rupees)) * 100)
    
    def convert_chunk(n):
        res = []
        if n >= 100:
            res.append(units[n // 100] + " Hundred")
            n %= 100
            if n > 0:
                res.append("and")
        if n >= 20:
            res.append(tens[n // 10])
            if n % 10:
                res.append(units[n % 10])
        elif n > 0:
            res.append(units[n])
        return " ".join(res)

    if rupees == 0:
        words = "Zero Rupees"
    else:
        parts = []
        # Crores (1,00,00,000)
        crore = rupees // 10000000
        if crore > 0:
            parts.append(convert_chunk(crore) + " Crore")
            rupees %= 10000000
        # Lakhs (1,00,000)
        lakh = rupees // 100000
        if lakh > 0:
            parts.append(convert_chunk(lakh) + " Lakh")
            rupees %= 100000
        # Thousands (1,000)
        thousand = rupees // 1000
        if thousand > 0:
            parts.append(convert_chunk(thousand) + " Thousand")
            rupees %= 1000
        # Remainder hundreds & tens
        if rupees > 0:
            parts.append(convert_chunk(rupees))
            
        words = " ".join(parts).strip() + " Rupees"

    if paise > 0:
        words += f" and {convert_chunk(paise)} Paise"
        
    return words + " Only"
