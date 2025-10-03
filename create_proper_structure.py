import re
from pathlib import Path
import shutil

# Delete and recreate the meta_docs folder
base_path = Path(r"b:\vsCode\hwca-mcp-2\meta_docs_proper")
if base_path.exists():
    shutil.rmtree(base_path)
base_path.mkdir(exist_ok=True)

# Read the HTML file
html_file = Path(r"b:\vsCode\hwca-mcp-2\Meta for Developers.html")
with open(html_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract navigation items with URLs
# Handle both quoted and unquoted attributes
# Pattern matches: <div id="..." title="..."><a ... href="URL" ...>
# We need to capture the URL associated with each navigation item
pattern = r'<div id="?([^"> ]+)"? title="?([^">]+)"?><a[^>]+href="?([^"\s>]+)"?'
matches = re.findall(pattern, content)

print(f"Found {len(matches)} navigation items\n")

def clean_name(name):
    """Clean name for use as filename or folder name"""
    name = re.sub(r'[<>:"/\\|?*]', '', name)
    name = name.replace('!', '')
    name = name.replace(',', '')
    name = name.replace('&amp;', 'and')
    name = name.strip()
    name = re.sub(r'\s+', '_', name)
    name = name.strip('_')
    return name[:100]

# Process navigation items - organize by section
nav_by_section = {}
skipped_items = []

for nav_id, title, url in matches:
    # Skip "Welcome creators!" - it's not a tab
    if nav_id.startswith("Welcome_creators"):
        continue
    
    # Extract section number from ID
    # Format examples:
    #   "Get_started-1" -> section 1
    #   "Members-only_worlds-11" -> section 11
    #   "Custom_models (FBX)-5" -> section 5
    #   "Get_started-1_1-0" -> section 1 (child item)
    #
    # Strategy: Section number is always -N where N is 1-14, appears once at root level
    # Find the last occurrence of "-<digits>" pattern before any subsequent underscores
    
    import re
    # Match pattern: hyphen followed by 1-2 digits, then either end-of-string or underscore
    section_match = re.search(r'-(\d{1,2})(?:_|$)', nav_id)
    
    if not section_match:
        skipped_items.append((nav_id, title, url, "no section number found"))
        continue
    
    try:
        section_num = int(section_match.group(1))
    except (ValueError, IndexError):
        skipped_items.append((nav_id, title, url, "section parse error"))
        continue
    
    if section_num not in nav_by_section:
        nav_by_section[section_num] = []
    
    nav_by_section[section_num].append((nav_id, title, url))

print(f"Found {len(nav_by_section)} main sections")
print(f"Section numbers: {sorted(nav_by_section.keys())}")
print(f"Skipped {len(skipped_items)} items\n")

# Helper to determine if an item has children
def get_children(parent_id, all_items):
    """Find all direct children of a parent item"""
    children = []
    
    # Parent pattern: if parent is "Get_started-1", children are "Get_started-1_1-X"
    # If parent is "Get_started-1_1-0", children are "Get_started-1_1-0_2-X"
    
    for item_id, item_title, item_url in all_items:
        # Check if this item's ID starts with parent ID followed by underscore
        if item_id.startswith(parent_id + "_"):
            # Make sure it's a direct child, not a grandchild
            remainder = item_id[len(parent_id)+1:]  # Everything after "parent_"
            
            # Count underscores in remainder - should be 0 for direct child
            # Example: "Get_started-1" -> "Get_started-1_1-0" (remainder: "1-0", 0 underscores = direct child)
            # Example: "Get_started-1_1-0" -> "Get_started-1_1-0_2-3" (remainder: "2-3", 0 underscores = direct child)
            if '_' not in remainder:
                children.append((item_id, item_title, item_url))
    
    return children

# Create structure for each section
stats = {'folders': 0, 'files': 0}

def create_item(item_id, item_title, item_url, parent_path, all_items, indent=0):
    """Create file or folder for an item"""
    global stats
    
    clean_title = clean_name(item_title)
    children = get_children(item_id, all_items)
    
    prefix = "  " * indent
    
    if children:
        # Has children -> create FOLDER
        folder_path = parent_path / clean_title
        folder_path.mkdir(exist_ok=True)
        stats['folders'] += 1
        
        print(f"{prefix}[FOLDER] {clean_title}/ ({len(children)} items)")
        
        # Process children recursively
        for child_id, child_title, child_url in children:
            create_item(child_id, child_title, child_url, folder_path, all_items, indent+1)
        
    else:
        # No children -> create FILE with just the URL
        file_path = parent_path / f"{clean_title}.md"
        with open(file_path, 'w', encoding='utf-8') as f:
            # Clean up the URL - remove the fragment identifier (#) if present
            clean_url = item_url.split('#')[0] if '#' in item_url else item_url
            f.write(f"{clean_url}\n")
        stats['files'] += 1
        
        print(f"{prefix}[FILE] {clean_title}.md")

# Define section names for those without simple parent divs
section_names = {
    5: ("Custom_models_(FBX)", "Custom models (FBX)"),
    7: ("Mobile_and_web", "Mobile and web"),
    9: ("Save_optimize_and_publish", "Save, optimize, and publish"),
    11: ("Members-only_worlds", "Members-only worlds"),
    13: ("Safety_and_privacy", "Safety and privacy")
}

# Process each section
for section_num in sorted(nav_by_section.keys()):
    items = nav_by_section[section_num]
    
    # Find the section folder name - use the base name from first item
    if items:
        first_id = items[0][0]
        # Extract base name (everything before first hyphen)
        base_name = first_id.split('-')[0]
        
        # Create clean folder name
        section_folder_name = clean_name(base_name)
        
        # Find a good display name - look for the _1-0 item or use base name
        display_name = base_name.replace('_', ' ').title()
        for item_id, item_title, item_url in items:
            if item_id.endswith(f"-{section_num}_1-0"):
                display_name = item_title
                break
        
        # Create section folder
        section_path = base_path / section_folder_name
        section_path.mkdir(exist_ok=True)
        stats['folders'] += 1
        
        print(f"\nSection {section_num:2d}: {display_name}")
        print(f"  [FOLDER] {section_folder_name}/")
        
        # Find all top-level items in this section (pattern: Name-Section_1-X)
        top_level_pattern = f"-{section_num}_1-"
        top_level_items = []
        
        for item_id, item_title, item_url in items:
            if top_level_pattern in item_id:
                # Count underscores after the pattern to ensure it's top-level
                after_pattern = item_id.split(top_level_pattern, 1)[1]
                # Top-level items have format: X where X has no underscore
                # Like: Desktop_editor-2_1-3, not Desktop_editor-2_1-3_2-0
                if '_' not in after_pattern:
                    top_level_items.append((item_id, item_title, item_url))
        
        # Remove duplicates and sort
        top_level_items = sorted(set(top_level_items), key=lambda x: x[0])
        
        # Process each top-level item
        for item_id, item_title, item_url in top_level_items:
            create_item(item_id, item_title, item_url, section_path, items, indent=1)

print(f"\n{'='*80}")
print(f"SUCCESS!")
print(f"Created {stats['folders']} folders and {stats['files']} files")
print(f"Base path: {base_path}")
print(f"{'='*80}")
