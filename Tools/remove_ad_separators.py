"""
Script to remove == ... == section dividers from Activity Diagrams in unified_plantuml_codes.md,
as PlantUML activity diagrams do not support == ... == syntax.
"""
import re

FILE = r'd:\justificadll\MarkDown\unified_plantuml_codes.md'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# We want to find all blocks between @startuml and @enduml that are Activity Diagrams
# In our file, Activity Diagrams start with |Actor| or start or similar, not autonumber / sequenceDiagram / actor / participant.
# Let's specifically remove the known lines or regex replace == ... == inside Activity Diagrams.

def clean_activity_block(match):
    block = match.group(0)
    # Remove lines like:   == Due Process == or == Verifikasi Admin ==
    cleaned = re.sub(r'^\s*==.*?==\s*$\n?', '', block, flags=re.MULTILINE)
    return cleaned

# Match @startuml to @enduml where it's an activity diagram (doesn't have 'autonumber' or 'sequenceDiagram')
pattern = r'@startuml(?!\s*\n\s*(?:autonumber|sequenceDiagram|skinparam|actor|participant|database|title\s+SD-)).*?@enduml'

content_new, count = re.subn(pattern, clean_activity_block, content, flags=re.DOTALL)

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content_new)

print(f"Cleaned Activity Diagrams. Replaced {count} blocks.")
