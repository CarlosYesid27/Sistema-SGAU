import re
from typing import List, Dict

def time_to_minutes(time_str: str) -> int:
    """Convert HH:MM to integer minutes from midnight."""
    try:
        hours, minutes = map(int, time_str.split(':'))
        return hours * 60 + minutes
    except ValueError:
        return 0

def parse_schedule(schedule_str: str) -> List[Dict]:
    """
    Parse a standard schedule string into a list of dictionaries.
    Format example: "Lunes 08:00-10:00, Miércoles 08:00-10:00"
    Returns: [{'day': 'Lunes', 'start': 480, 'end': 600}, ...]
    """
    if not schedule_str:
        return []
        
    blocks = []
    # Pattern to match: "Day HH:MM-HH:MM"
    pattern = re.compile(r'([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})')
    
    parts = schedule_str.split(',')
    for part in parts:
        match = pattern.search(part)
        if match:
            day = match.group(1).strip().lower()
            start_time = match.group(2)
            end_time = match.group(3)
            blocks.append({
                'day': day,
                'start': time_to_minutes(start_time),
                'end': time_to_minutes(end_time)
            })
    return blocks

def check_schedule_overlap(schedule1: str, schedule2: str) -> bool:
    """
    Check if two schedule strings overlap.
    Returns True if there is an overlap, False otherwise.
    """
    if not schedule1 or not schedule2:
        return False
        
    blocks1 = parse_schedule(schedule1)
    blocks2 = parse_schedule(schedule2)
    
    if not blocks1 or not blocks2:
        # If we can't parse one of them, fallback to exact match to be safe
        return schedule1.strip().lower() == schedule2.strip().lower()

    for b1 in blocks1:
        for b2 in blocks2:
            if b1['day'] == b2['day']:
                # Overlap condition: max(start1, start2) < min(end1, end2)
                max_start = max(b1['start'], b2['start'])
                min_end = min(b1['end'], b2['end'])
                if max_start < min_end:
                    return True
                    
    return False
