import os
import re

root_dir = r"c:\Users\Računalo\Desktop\Afffilate web stranica"
domain = "https://webalati.tech"

noindex_issues = []
canonical_issues = []
all_pages = []

for root, dirs, files in os.walk(root_dir):
    if '.git' in dirs: dirs.remove('.git')
    if '.agents' in dirs: dirs.remove('.agents')
    if 'node_modules' in dirs: dirs.remove('node_modules')
    if '.claude' in dirs: dirs.remove('.claude')
    if '.gemini' in dirs: dirs.remove('.gemini')
    
    for file in files:
        if file.endswith('.html'):
            full_path = os.path.join(root, file)
            # relative path with forward slashes
            rel_path = os.path.relpath(full_path, root_dir).replace('\\', '/')
            if rel_path.endswith('index.html'):
                if rel_path == 'index.html':
                    expected_url = domain + "/en/"
                else:
                    expected_url = domain + "/" + rel_path[:-10]
            else:
                expected_url = domain + "/" + rel_path
            
            all_pages.append(expected_url)
            
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                    # Noindex check
                    if 'noindex' in content.lower():
                        if rel_path != 'index.html':
                            noindex_issues.append((rel_path, "Contains noindex tag but shouldn't"))
                    
                    # Canonical check
                    match = re.search(r'<link\s+rel="canonical"\s+href="([^"]+)"', content)
                    if match:
                        canonical = match.group(1)
                        if canonical != expected_url:
                            canonical_issues.append((rel_path, f"Expected {expected_url}, but got {canonical}"))
                    else:
                        canonical_issues.append((rel_path, "Missing canonical tag"))
            except Exception as e:
                print(f"Error reading {rel_path}: {e}")

with open(os.path.join(root_dir, 'audit_report.txt'), 'w', encoding='utf-8') as f:
    f.write("--- NOINDEX ISSUES ---\n")
    for issue in noindex_issues:
        f.write(f"{issue[0]}: {issue[1]}\n")

    f.write("\n--- CANONICAL ISSUES ---\n")
    for issue in canonical_issues:
        f.write(f"{issue[0]}: {issue[1]}\n")
