import os
import re
import glob
import json

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

base_dir = r"c:\Users\Računalo\Desktop\affiliate web stranica - nova\Afffilate web stranica - Copy"

html_files = []
html_files.extend(glob.glob(os.path.join(base_dir, "hr", "**", "*.html"), recursive=True))
html_files.extend(glob.glob(os.path.join(base_dir, "en", "**", "*.html"), recursive=True))
html_files.append(os.path.join(base_dir, "index.html"))

# 1. LAZY LOADING & 4. ARIA LABELS & 3. BREADCRUMBS
for filepath in set(html_files):
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Lazy Loading
    # Find all <img ...> and ensure loading="lazy" is present
    def add_lazy(m):
        tag = m.group(0)
        if 'loading=' not in tag:
            tag = tag.replace('<img ', '<img loading="lazy" ')
        return tag
    content = re.sub(r'<img\s+[^>]+>', add_lazy, content, flags=re.IGNORECASE)
    
    # ARIA labels for buttons
    content = content.replace('class="nav-cta-pill"', 'class="nav-cta-pill" aria-label="Browse Tools"')
    content = content.replace('id="close-modal"', 'id="close-modal" aria-label="Close"')
    content = content.replace('id="open-newsletter-btn"', 'id="open-newsletter-btn" aria-label="Subscribe to newsletter"')
    if 'aria-label="Submit"' not in content:
        content = content.replace('class="btn-primary form-submit-btn"', 'class="btn-primary form-submit-btn" aria-label="Submit"')

    # Breadcrumbs Schema (only for category and blog pages, not index)
    filename = os.path.basename(filepath)
    is_root_index = filename == "index.html" and os.path.dirname(filepath) == base_dir
    is_lang_index = filename == "index.html" and (os.path.dirname(filepath).endswith("hr") or os.path.dirname(filepath).endswith("en"))
    
    if not is_root_index and not is_lang_index and 'BreadcrumbList' not in content:
        # Generate Breadcrumbs
        lang = 'en' if '\\en\\' in filepath else 'hr'
        title_match = re.search(r'<title>(.*?)<\/title>', content, re.IGNORECASE)
        page_title = title_match.group(1).split('—')[0].split('|')[0].strip() if title_match else filename
        
        home_name = "Home" if lang == 'en' else "Početna"
        
        breadcrumb_ld = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": home_name,
                    "item": f"https://webalati.tech/{lang}/"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": page_title
                }
            ]
        }
        
        script_tag = f'\n    <script type="application/ld+json">\n    {json.dumps(breadcrumb_ld, indent=4)}\n    </script>\n</head>'
        content = content.replace('</head>', script_tag)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Processed {len(html_files)} HTML files for lazy loading, ARIA labels, and breadcrumbs.")

# 2. WEBP CONVERSION
if HAS_PIL:
    images_dir = os.path.join(base_dir, "images")
    img_files = glob.glob(os.path.join(images_dir, "**", "*.*"), recursive=True)
    converted_count = 0
    
    for img_path in img_files:
        ext = os.path.splitext(img_path)[1].lower()
        if ext in ['.jpg', '.jpeg', '.png']:
            webp_path = os.path.splitext(img_path)[0] + '.webp'
            if not os.path.exists(webp_path):
                try:
                    with Image.open(img_path) as im:
                        im.save(webp_path, 'webp', quality=85)
                        converted_count += 1
                except Exception as e:
                    print(f"Failed to convert {img_path}: {e}")
                    
    print(f"Converted {converted_count} images to WebP.")
    
    # Update HTML files to point to .webp
    if converted_count > 0:
        for filepath in set(html_files):
            if not os.path.exists(filepath): continue
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            orig_content = content
            content = re.sub(r'(\.\./images/[^"\'\s]+)\.(jpg|jpeg|png)', r'\1.webp', content, flags=re.IGNORECASE)
            content = re.sub(r'(images/[^"\'\s]+)\.(jpg|jpeg|png)', r'\1.webp', content, flags=re.IGNORECASE)
            
            if orig_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
        print("Updated HTML files to use .webp extensions.")
else:
    print("PIL not installed, skipping WebP conversion.")
    
print("SEO Boost Complete!")
