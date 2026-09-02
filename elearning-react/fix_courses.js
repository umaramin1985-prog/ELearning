const fs = require('fs');
let content = fs.readFileSync('src/pages/Courses.jsx', 'utf8');

for (let i = 1; i <= 6; i++) {
    // 1. Replace header
    const searchHeader = `<div className="module-header" onClick={() => toggleModule(${i})}`;
    const headerReplacement = `<div className="module-header" style={{ justifyContent: 'space-between', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}`;
    content = content.replace(searchHeader, headerReplacement);
    
    // Remove the chevron in the header
    const searchChevron = `<i className={\`fa-solid \${expandedModules[${i}] ? 'fa-chevron-up' : 'fa-chevron-down'}\`} style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}></i>`;
    content = content.replace(searchChevron, '');

    // 2. Remove conditional rendering for the whole content
    const searchConditional = `{expandedModules[${i}] && (\n                                                <div className="module-content fade-in">`;
    const conditionalReplacement = `<div className="module-content fade-in">`;
    content = content.replace(searchConditional, conditionalReplacement);

    // 3. Add conditional rendering to Key Topics
    const searchTopics = `<h4>Key Topics:</h4>`;
    const topicsReplacement = `<h4 onClick={() => toggleModule(${i})} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '1.5rem' }}>\n                                                Key Topics:\n                                                <i className={\`fa-solid \${expandedModules[${i}] ? 'fa-chevron-up' : 'fa-chevron-down'}\`} style={{ fontSize: '1rem', color: 'var(--primary-color)' }}></i>\n                                            </h4>\n                                            {expandedModules[${i}] && (`;
    content = content.replace(searchTopics, topicsReplacement);

    // 4. Close the conditional rendering after the UL
    // This is a bit tricky, let's use regex to find the UL that follows Key Topics and close the brace after it.
    // In our new content, it's: {expandedModules[i] && ( \n <ul>...</ul> \n ) }
    // Let's replace `</ul>` with `</ul>\n                                            )}`
    // BUT only the FIRST `</ul>` after `expandedModules[${i}] && (`.
    const splitStr = `{expandedModules[${i}] && (`;
    const parts = content.split(splitStr);
    if (parts.length > 1) {
        // parts[1] starts with the ul. We find the first </ul> in parts[1].
        parts[1] = parts[1].replace('</ul>', '</ul>\n                                            )}');
        content = parts.join(splitStr);
    }

    // 5. Remove the closing `)}` at the very end of the module content
    // The structure is:
    // <div className="module-pricing">
    // ...
    // </div>
    //     </div>
    // )}
    // Let's replace the last `\n                                            )}` in the module
    const searchFooter = `</button>\n                                                        </>\n                                                    )\n                                                })()}\n                                            </div>\n                                                </div>\n                                            )}`;
    const footerReplacement = `</button>\n                                                        </>\n                                                    )\n                                                })()}\n                                            </div>\n                                                </div>`;
    content = content.replace(searchFooter, footerReplacement);
}

fs.writeFileSync('src/pages/Courses.jsx', content);
console.log('Done');
