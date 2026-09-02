import re

with open('src/pages/Courses.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

for i in range(1, 7):
    # Fix the header tag
    # Current: <div className="module-header" onClick={() => toggleModule(1)} style={{ cursor: 'pointer', justifyContent: 'space-between', paddingBottom: expandedModules[1] ? '1.5rem' : '0', marginBottom: expandedModules[1] ? '1.5rem' : '0' }}>
    old_header = f'<div className="module-header" onClick={{() => toggleModule({i})}} style={{{{ cursor: \'pointer\', justifyContent: \'space-between\', paddingBottom: expandedModules[{i}] ? \'1.5rem\' : \'0\', marginBottom: expandedModules[{i}] ? \'1.5rem\' : \'0\' }}}}>'
    new_header = f'<div className="module-header" style={{{{ justifyContent: \'space-between\', paddingBottom: \'1.5rem\', marginBottom: \'1.5rem\' }}}}>'
    content = content.replace(old_header, new_header)

    # Remove the chevron in the header
    chevron_str = f'<i className={{`fa-solid ${{expandedModules[{i}] ? \'fa-chevron-up\' : \'fa-chevron-down\'}}`}} style={{{{ fontSize: \'1.5rem\', color: \'var(--primary-color)\' }}}}></i>'
    content = content.replace(chevron_str, '')

    # Remove the conditional rendering wrapper for the entire content
    cond_wrapper = f'{{expandedModules[{i}] && (\n                                                <div className="module-content fade-in">'
    new_wrapper = f'<div className="module-content fade-in">'
    content = content.replace(cond_wrapper, new_wrapper)

    # The previous script might have added the nested {expandedModules[i] && ( correctly but failed to remove the trailing `)}` for the outer wrapper.
    # The trailing `)}` is at the end of each module. Let's find it.
    # We look for:
    # </div>
    #     </div>
    # )}
    # And replace with just:
    # </div>
    #     </div>
    # But wait! We need to make sure we only remove the OUTMOST `)}` of the module.
    # A safe way is to find `<div className="module-pricing"> ... </div> \n </div> \n )}`
    # Since we can't easily do string replacement for the footer, let's use regex:
    pattern_footer = r'(<div className=\"module-pricing\">.*?</div>\s*)\s*</div>\s*\)\}'
    def repl_footer(m):
        return f'{m.group(1)}\n                                                </div>'
    content = re.sub(pattern_footer, repl_footer, content, flags=re.DOTALL, count=1)


with open('src/pages/Courses.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed remaining course issues')
