const fs = require('fs');
let code = fs.readFileSync('src/pages/Courses.jsx', 'utf8');

// Add state
if (!code.includes('expandedModules')) {
    code = code.replace(
        'const [selectedSlotInfo, setSelectedSlotInfo] = useState(null);',
        'const [selectedSlotInfo, setSelectedSlotInfo] = useState(null);\n    const [expandedModules, setExpandedModules] = useState({});\n    const toggleModule = (moduleId) => {\n        setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));\n    };'
    );
}

// Replace headers
for(let i=1; i<=6; i++) {
    const headerRegex = new RegExp('<div className="module-header">[\\s\\S]*?<span className="module-number">' + i + '</span>[\\s\\S]*?<h3>(.*?)</h3>[\\s\\S]*?</div>');
    const match = code.match(headerRegex);
    if(match) {
        const title = match[1];
        const replacement = `<div className="module-header" onClick={() => toggleModule(${i})} style={{ cursor: 'pointer', justifyContent: 'space-between', paddingBottom: expandedModules[${i}] ? '1.5rem' : '0', marginBottom: expandedModules[${i}] ? '1.5rem' : '0' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                                    <span className="module-number">${i}</span>
                                                    <h3 style={{ margin: 0 }}>${title}</h3>
                                                </div>
                                                <i className={\`fa-solid \${expandedModules[${i}] ? 'fa-chevron-up' : 'fa-chevron-down'}\`} style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}></i>
                                            </div>
                                            {expandedModules[${i}] && (
                                                <div className="module-content fade-in">`;
        code = code.replace(match[0], replacement);
    }
}

// Ensure proper CRLF/LF for splitting
code = code.replace(/\r\n/g, '\n');

// Now replace the endings of the modules.
const endingStr = `                                                    )
                                                })()}
                                            </div>
                                        </div>`;
const replacementEnd = `                                                    )
                                                })()}
                                            </div>
                                                </div>
                                            )}
                                        </div>`;

code = code.split(endingStr).join(replacementEnd);

fs.writeFileSync('src/pages/Courses.jsx', code);
console.log('Done!');
