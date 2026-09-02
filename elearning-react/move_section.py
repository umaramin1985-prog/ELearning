import re

with open('src/pages/Home.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# The content to move:
#                     <div>
#                         <h2 className="section-title">The Power of Data Analytics</h2>
#                         ...
#                         </div>
#                     </div>

# Regex to find the core-info section and extract its inner div
core_info_pattern = r'(\s*\{/\* CORE INFO SECTION \*/\}\s*<section id="core-info" className="section bg-light">\s*<div className="container">\s*)(<div.*?>\s*<h2 className="section-title">The Power of Data Analytics.*?</div>\s*</div>)(\s*</div>\s*</section>)'

match = re.search(core_info_pattern, content, re.DOTALL)
if match:
    core_info_inner = match.group(2)
    
    # Remove the whole core-info section
    content = content.replace(match.group(0), '')
    
    # Now find where to insert it: right before {/* Services Feature Grid (4 Col) */}
    insert_pattern = r'(\s*\{/\* Services Feature Grid \(4 Col\) \*/\})'
    
    # Create the block to insert: Add some margin bottom so it's spaced from the grid
    insert_block = f'\n\n                    <div style={{{{ width: \'100%\', marginBottom: \'4rem\' }}}}>\n                        {core_info_inner}\n                    </div>\n\\1'
    
    content = re.sub(insert_pattern, insert_block, content, count=1)
    
    with open('src/pages/Home.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully moved The Power of Data Analytics section.")
else:
    print("Could not find the core-info section.")
