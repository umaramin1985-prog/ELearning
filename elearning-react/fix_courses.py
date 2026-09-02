import re

with open('src/pages/Courses.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

for i in range(1, 7):
    # 1. Fix header
    # We use string modulo formatting to avoid f-string escaping nightmare
    pattern_header = r'<div className=\"module-header\" onClick=\{\(\) => toggleModule\(%d\)\}.*?>\s*(.*?)\s*<i className=\{`fa-solid \$\{expandedModules\[%d\].*?\}</i>\s*</div>\s*\{expandedModules\[%d\] && \(\s*<div className=\"module-content fade-in\">' % (i, i, i)
    
    def repl_header(m):
        return '<div className=\"module-header\" style={{ justifyContent: \'space-between\', paddingBottom: \'1.5rem\', marginBottom: \'1.5rem\' }}>\n                                                %s\n                                            </div>\n                                            <div className=\"module-content fade-in\">' % m.group(1)
    
    content = re.sub(pattern_header, repl_header, content, flags=re.DOTALL)
    
    # 2. Fix Key Topics
    pattern_topics = r'<h4>Key Topics:</h4>\s*(<ul>.*?</ul>)'
    
    def repl_topics(m):
        return '<h4 onClick={() => toggleModule(%d)} style={{ cursor: \'pointer\', display: \'flex\', alignItems: \'center\', gap: \'10px\' }}>\n                                                Key Topics:\n                                                <i className={`fa-solid ${expandedModules[%d] ? \'fa-chevron-up\' : \'fa-chevron-down\'}`} style={{ fontSize: \'1rem\', color: \'var(--primary-color)\' }}></i>\n                                            </h4>\n                                            {expandedModules[%d] && (\n                                                %s\n                                            )}' % (i, i, i, m.group(1))
        
    content = re.sub(pattern_topics, repl_topics, content, flags=re.DOTALL, count=1)
    
    # 3. Fix the closing div
    pattern_footer = r'(<div className=\"module-pricing\">.*?</div>\s*)\s*</div>\s*\)\}'
    def repl_footer(m):
        return '%s\n                                            </div>' % m.group(1)
        
    content = re.sub(pattern_footer, repl_footer, content, flags=re.DOTALL, count=1)


with open('src/pages/Courses.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated Courses.jsx')
