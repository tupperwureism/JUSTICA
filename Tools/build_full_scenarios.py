import os
import subprocess

tools_dir = r'd:\justificadll\Tools'
scripts = [
    'upgrade_use_case_scenarios.py',
    'append_section_b.py',
    'append_section_c.py',
    'append_section_d.py'
]

for script in scripts:
    path = os.path.join(tools_dir, script)
    print(f"Running {script}...")
    res = subprocess.run(['python', path], capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Error running {script}: {res.stderr}")
        exit(1)
    print(res.stdout.strip())

target_file = r'd:\justificadll\MarkDown\unified_use_case_scenarios.md'
with open(target_file, 'r', encoding='utf-8') as f:
    content = f.read()
    lines = content.splitlines()

print(f"\n--- VERIFICATION ---")
print(f"Total Lines: {len(lines)}")
print(f"Total Characters: {len(content)}")

# Check section headings
for heading in ['# Spesifikasi Skenario Use Case', '## A. Aktor: Klien', '## B. Aktor: Mitra Profesional', '## C. Aktor: Admin Sistem', '## D. Skenario Spesifik Domain']:
    count = content.count(heading)
    print(f"Heading '{heading}': {count} occurrences")

# Count Use Cases
ucs = [f"### UC-{i:02d}" for i in range(1, 18) if i != 16 or i == 16] + ['### Kes-UC01', '### Kes-UC02', '### Kes-UC03', '### Psi-UC01', '### Psi-UC02', '### Psi-UC03', '### Huk-UC01', '### Huk-UC02', '### Huk-UC03']
print(f"\nUse Case Check:")
missing = 0
for uc in ucs:
    if uc in content:
        print(f"  [OK] {uc}")
    else:
        print(f"  [MISSING] {uc}")
        missing += 1

if missing == 0:
    print("\nSUCCESS: All 26 Use Cases present and upgraded!")
else:
    print(f"\nWARNING: {missing} Use Cases missing!")
