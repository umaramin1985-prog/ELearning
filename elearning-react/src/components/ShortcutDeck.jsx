import React, { useState, useMemo, useRef, useEffect } from 'react';
import './ShortcutDeck.css';

const TABS = [
    { id: 'power-bi', label: 'Power BI Desktop', icon: 'fa-solid fa-chart-column' },
    { id: 'power-query', label: 'Power Query', icon: 'fa-solid fa-filter' },
    { id: 'dax', label: 'DAX Formulas', icon: 'fa-solid fa-square-root-variable' },
    { id: 'checklist', label: 'Data Model Checklist', icon: 'fa-solid fa-list-check' },
    { id: 'all', label: 'All Shortcuts', icon: 'fa-solid fa-layer-group' }
];

const SHORTCUT_GROUPS = [
    {
        id: 'pbi-modeling',
        category: 'power-bi',
        categoryLabel: 'Power BI Desktop',
        title: 'Data Modeling & Refresh',
        icon: 'fa-solid fa-diagram-project',
        items: [
            { id: 'pbi-e', keys: ['Ctrl', 'E'], desc: 'Open the Power Query Editor' },
            { id: 'pbi-r', keys: ['Ctrl', 'R'], desc: 'Refresh data in the data model' },
            { id: 'pbi-l', keys: ['Ctrl', 'L'], desc: 'Load data to the data model' },
            { id: 'pbi-m', keys: ['Ctrl', 'M'], desc: 'Add a new DAX measure' },
            { id: 'pbi-t', keys: ['Ctrl', 'T'], desc: 'Create a new calculated table' },
            { id: 'pbi-st', keys: ['Ctrl', 'Shift', 'T'], desc: 'Create a new table from a query' },
            { id: 'pbi-sm', keys: ['Ctrl', 'Shift', 'M'], desc: 'Edit the M code in Power Query' },
            { id: 'pbi-sf', keys: ['Ctrl', 'Shift', 'F'], desc: 'Format the selected column' }
        ]
    },
    {
        id: 'pbi-formatting',
        category: 'power-bi',
        categoryLabel: 'Power BI Desktop',
        title: 'Visual Formatting & Canvas',
        icon: 'fa-solid fa-palette',
        items: [
            { id: 'pbi-sc', keys: ['Ctrl', 'Shift', 'C'], desc: 'Copy formatting from a visual (Format Painter)' },
            { id: 'pbi-sv', keys: ['Ctrl', 'Shift', 'V'], desc: 'Paste formatting onto another visual' },
            { id: 'pbi-g', keys: ['Ctrl', 'G'], desc: 'Group selected visuals' },
            { id: 'pbi-sg', keys: ['Ctrl', 'Shift', 'G'], desc: 'Ungroup selected visuals' },
            { id: 'pbi-d', keys: ['Ctrl', 'D'], desc: 'Duplicate selected visual(s)' },
            { id: 'pbi-k', keys: ['Ctrl', 'K'], desc: 'Add a bookmark' },
            { id: 'pbi-sk', keys: ['Ctrl', 'Shift', 'K'], desc: 'Manage bookmarks' },
            { id: 'pbi-biu', keys: ['Ctrl', 'Shift', 'B / I / U'], desc: 'Bold, italicize, or underline selected text' },
            { id: 'pbi-s16', keys: ['Ctrl', 'Shift', '1–6'], desc: 'Apply conditional formatting (1 lowest to 6 highest)' }
        ]
    },
    {
        id: 'pbi-exploration',
        category: 'power-bi',
        categoryLabel: 'Power BI Desktop',
        title: 'Data Exploration & Report View',
        icon: 'fa-solid fa-compass',
        items: [
            { id: 'pbi-f2', keys: ['Ctrl', 'F2'], desc: 'Focus on the Filter pane' },
            { id: 'pbi-16', keys: ['Ctrl', '1–6'], desc: 'Apply filter type (1 basic, 2 advanced, etc.)' },
            { id: 'pbi-c16', keys: ['Ctrl', 'Shift', '1–6'], desc: 'Clear active filter type' },
            { id: 'pbi-slash', keys: ['Ctrl', '/'], desc: 'Open the Smart Search dialog' },
            { id: 'pbi-drill', keys: ['Alt', '← / →'], desc: 'Go back or forward across pages and drillthrough states' },
            { id: 'pbi-click', keys: ['Ctrl', 'Click'], desc: 'Add or remove a visual from selection' },
            { id: 'pbi-aclick', keys: ['Ctrl', 'Alt', 'Click'], desc: 'Select all visuals associated with a field' },
            { id: 'pbi-dot', keys: ['Ctrl', '.'], desc: 'Open the context menu for the selected visual' },
            { id: 'pbi-ss', keys: ['Ctrl', 'Shift', 'S'], desc: 'Take a screenshot of selected visual(s)' },
            { id: 'pbi-p', keys: ['Ctrl', 'P'], desc: 'Export the report as a PDF' },
            { id: 'pbi-f11', keys: ['Ctrl', 'F11'], desc: 'Enter full-screen mode' }
        ]
    },
    {
        id: 'pq-transform',
        category: 'power-query',
        categoryLabel: 'Power Query',
        title: 'Data Transformation & Execution',
        icon: 'fa-solid fa-wand-magic-sparkles',
        items: [
            { id: 'pq-t', keys: ['Ctrl', 'T'], desc: 'Create a table from selected data' },
            { id: 'pq-st', keys: ['Ctrl', 'Shift', 'T'], desc: 'Convert a table into a list' },
            { id: 'pq-sf', keys: ['Ctrl', 'Shift', 'F'], desc: 'Format table columns' },
            { id: 'pq-m', keys: ['Ctrl', 'M'], desc: 'Merge queries' },
            { id: 'pq-h', keys: ['Ctrl', 'H'], desc: 'Show or hide the Query Dependencies view' },
            { id: 'pq-f1', keys: ['Ctrl', 'F1'], desc: 'Expand or collapse the formula bar' },
            { id: 'pq-e', keys: ['Ctrl', 'E'], desc: 'Execute the current query' },
            { id: 'pq-l', keys: ['Ctrl', 'L'], desc: 'Load query results to Excel or Power BI' }
        ]
    },
    {
        id: 'pq-steps',
        category: 'power-query',
        categoryLabel: 'Power Query',
        title: 'Step Navigation & Quick Columns',
        icon: 'fa-solid fa-stairs',
        items: [
            { id: 'pq-up', keys: ['Ctrl', '↑'], desc: 'Move to the previous applied step' },
            { id: 'pq-down', keys: ['Ctrl', '↓'], desc: 'Move to the next applied step' },
            { id: 'pq-sup', keys: ['Ctrl', 'Shift', '↑'], desc: 'Move selected step(s) up' },
            { id: 'pq-sdown', keys: ['Ctrl', 'Shift', '↓'], desc: 'Move selected step(s) down' },
            { id: 'pq-asf', keys: ['Alt', 'Shift', 'F'], desc: 'Add a custom formula or function' },
            { id: 'pq-ac', keys: ['Alt', 'C'], desc: 'Create a conditional column' },
            { id: 'pq-ad', keys: ['Alt', 'D'], desc: 'Create a date calculation' },
            { id: 'pq-an', keys: ['Alt', 'N'], desc: 'Create a numeric calculation' },
            { id: 'pq-as', keys: ['Alt', 'S'], desc: 'Create a text calculation' }
        ]
    },
    {
        id: 'pq-editing',
        category: 'power-query',
        categoryLabel: 'Power Query',
        title: 'Query Editor & Grid Selection',
        icon: 'fa-solid fa-table-cells',
        items: [
            { id: 'pq-f2', keys: ['F2'], desc: 'Edit the selected cell' },
            { id: 'pq-cent', keys: ['Ctrl', 'Enter'], desc: 'Apply changes and keep the cell selected' },
            { id: 'pq-aent', keys: ['Alt', 'Enter'], desc: 'Start a new line within a formula or expression' },
            { id: 'pq-csent', keys: ['Ctrl', 'Shift', 'Enter'], desc: 'Insert a new line in the formula bar' },
            { id: 'pq-esc', keys: ['Esc'], desc: 'Cancel editing or close the formula bar' },
            { id: 'pq-col', keys: ['Ctrl', 'Space'], desc: 'Select the entire column' },
            { id: 'pq-row', keys: ['Shift', 'Space'], desc: 'Select the entire row' },
            { id: 'pq-dup', keys: ['Ctrl', 'D'], desc: 'Duplicate selected query elements' },
            { id: 'pq-find', keys: ['Ctrl', 'F'], desc: 'Open the Find and Replace dialog' },
            { id: 'pq-tab', keys: ['Tab / Shift + Tab'], desc: 'Navigate forward or backward across Power Query controls' }
        ]
    },
    {
        id: 'dax-editing',
        category: 'dax',
        categoryLabel: 'DAX Formulas',
        title: 'DAX Formula Bar & Autocomplete',
        icon: 'fa-solid fa-code',
        items: [
            { id: 'dax-n', keys: ['Ctrl', 'N'], desc: 'Create a new measure or calculated column' },
            { id: 'dax-f2', keys: ['F2'], desc: 'Edit the selected DAX formula' },
            { id: 'dax-sp', keys: ['Ctrl', 'Space'], desc: 'Autocomplete the function or column name' },
            { id: 'dax-ssp', keys: ['Ctrl', 'Shift', 'Space'], desc: 'Autocomplete the entire formula' },
            { id: 'dax-sa', keys: ['Ctrl', 'Shift', 'A'], desc: 'Open the function arguments dialog' },
            { id: 'dax-aent', keys: ['Alt', 'Enter'], desc: 'Start a new line inside a DAX formula' },
            { id: 'dax-csent', keys: ['Ctrl', 'Shift', 'Enter'], desc: 'Create a new line in the formula bar' },
            { id: 'dax-cent', keys: ['Ctrl', 'Enter'], desc: 'Apply changes and keep the formula bar open' }
        ]
    },
    {
        id: 'dax-functions',
        category: 'dax',
        categoryLabel: 'DAX Formulas',
        title: 'DAX Formatting & Navigation',
        icon: 'fa-solid fa-text-height',
        items: [
            { id: 'dax-tab', keys: ['Tab / Shift + Tab'], desc: 'Indent or outdent the selected DAX code block' },
            { id: 'dax-all', keys: ['Ctrl', 'A'], desc: 'Select all DAX code in the current formula' },
            { id: 'dax-find', keys: ['Ctrl', 'F'], desc: 'Open Find and Replace for DAX code' },
            { id: 'dax-upper', keys: ['Ctrl', 'Shift', 'U'], desc: 'Convert selected column or table name to UPPERCASE' },
            { id: 'dax-lower', keys: ['Ctrl', 'Shift', 'L'], desc: 'Convert selected column or table name to lowercase' },
            { id: 'dax-prop', keys: ['Ctrl', 'Shift', 'P'], desc: 'Convert selected column or table name to Proper Case' },
            { id: 'dax-esc', keys: ['Esc'], desc: 'Cancel editing or close the DAX formula bar' }
        ]
    }
];

const CHECKLIST_STAGES = [
    {
        num: '01',
        title: 'Data Collection & Import',
        steps: [
            { label: 'Data Sources', text: 'Identify and select relevant source systems.' },
            { label: 'Data Quality', text: 'Ensure data is clean, accurate, and consistent.' },
            { label: 'Data Extraction', text: 'Extract data from sources using appropriate methods.' },
            { label: 'Data Transformation', text: 'Apply cleaning and formatting to prepare for analysis.' },
            { label: 'Data Model Plan', text: 'Design a schema to define relationships between tables.' }
        ]
    },
    {
        num: '02',
        title: 'Data Loading & Refresh',
        steps: [
            { label: 'Data Loading', text: 'Load data into Power BI using Power Query (Import) or DirectQuery.' },
            { label: 'Data Refresh', text: 'Set up scheduled data refresh to keep reports up-to-date.' },
            { label: 'Ongoing Shaping', text: 'Continue refining transformations as needed inside Power Query.' }
        ]
    },
    {
        num: '03',
        title: 'Data Cleansing & Transformation',
        steps: [
            { label: 'Remove Duplicates', text: 'Eliminate duplicate records from the dataset.' },
            { label: 'Handle Null Values', text: 'Address null or missing values appropriately.' },
            { label: 'Assign Data Types', text: 'Set accurate date, text, and numeric field types.' },
            { label: 'Data Aggregation', text: 'Create necessary summary aggregations.' },
            { label: 'Calculated Columns & Slicing', text: 'Add DAX calculated columns where needed and segment data for analysis.' }
        ]
    },
    {
        num: '04',
        title: 'Data Modeling',
        steps: [
            { label: 'Relationships', text: 'Define table relationships cleanly (one-to-one, one-to-many).' },
            { label: 'Hierarchies', text: 'Create hierarchies for smooth drill-down exploration.' },
            { label: 'DAX Measures', text: 'Define reusable DAX measures for KPIs and calculations.' },
            { label: 'Date Calendars', text: 'Create dedicated date tables for time-intelligence analysis.' },
            { label: 'Sorting & Formatting', text: 'Configure appropriate sorting and display formats for fields.' }
        ]
    },
    {
        num: '05',
        title: 'Data Security & Optimization',
        steps: [
            { label: 'Row-Level Security', text: 'Implement Row-Level Security (RLS) when data scoping is required.' },
            { label: 'Role-Based Access', text: 'Define roles and permissions cleanly for report consumers.' },
            { label: 'Performance Testing', text: 'Test queries and visuals to isolate bottlenecks.' },
            { label: 'Indexing & Query Folding', text: 'Optimize model efficiency and preserve Power Query folding.' }
        ]
    },
    {
        num: '06',
        title: 'Documentation & Version Control',
        steps: [
            { label: 'Data Dictionary', text: 'Create a data dictionary explaining every key field definition.' },
            { label: 'Source Documentation', text: 'Document source origins, updates, and refresh schedules.' },
            { label: 'Model Documentation', text: 'Document table relationships and complex DAX calculations.' },
            { label: 'Versioning & Backups', text: 'Use version control for changes and regularly back up definitions.' }
        ]
    }
];

const ShortcutDeck = ({ id = 'shortcut-playbook' }) => {
    const [activeTab, setActiveTab] = useState('power-bi');
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedId, setCopiedId] = useState(null);
    const copyTimerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
        };
    }, []);

    const tabCounts = useMemo(() => {
        const counts = { all: 0, checklist: CHECKLIST_STAGES.length };
        SHORTCUT_GROUPS.forEach((group) => {
            counts[group.category] = (counts[group.category] || 0) + group.items.length;
            counts.all += group.items.length;
        });
        return counts;
    }, []);

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const isSearching = normalizedQuery.length > 0;

    const visibleGroups = useMemo(() => {
        return SHORTCUT_GROUPS.map((group) => {
            if (!isSearching && activeTab !== 'all' && group.category !== activeTab) {
                return null;
            }
            const matchingItems = group.items.filter((item) => {
                if (!isSearching) return true;
                const keyText = item.keys.join(' + ').toLowerCase();
                return (
                    keyText.includes(normalizedQuery) ||
                    item.desc.toLowerCase().includes(normalizedQuery) ||
                    group.title.toLowerCase().includes(normalizedQuery) ||
                    group.categoryLabel.toLowerCase().includes(normalizedQuery)
                );
            });
            if (matchingItems.length === 0) return null;
            return { ...group, items: matchingItems };
        }).filter(Boolean);
    }, [activeTab, isSearching, normalizedQuery]);

    const visibleChecklist = useMemo(() => {
        if (!isSearching && activeTab !== 'checklist') {
            return [];
        }
        return CHECKLIST_STAGES.map((stage) => {
            if (!isSearching) return stage;
            const stageMatches = stage.title.toLowerCase().includes(normalizedQuery);
            if (stageMatches) return stage;
            const filteredSteps = stage.steps.filter(
                (step) =>
                    step.label.toLowerCase().includes(normalizedQuery) ||
                    step.text.toLowerCase().includes(normalizedQuery)
            );
            if (filteredSteps.length === 0) return null;
            return { ...stage, steps: filteredSteps };
        }).filter(Boolean);
    }, [activeTab, isSearching, normalizedQuery]);

    const handleCopyShortcut = async (item) => {
        const textToCopy = `${item.keys.join(' + ')} — ${item.desc}`;
        try {
            await navigator.clipboard?.writeText(textToCopy);
            setCopiedId(item.id);
            if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
            copyTimerRef.current = window.setTimeout(() => setCopiedId(null), 1500);
        } catch {
            // Clipboard permission may be restricted in non-HTTPS contexts
        }
    };

    const hasNoResults = visibleGroups.length === 0 && visibleChecklist.length === 0;

    return (
        <section id={id} className="shortcut-playbook-section" aria-label="Power BI Keyboard Shortcuts and Data Model Checklist">
            <div className="shortcut-playbook-header">
                <div>
                    <div className="shortcut-playbook-eyebrow">
                        <i className="fa-solid fa-keyboard" aria-hidden="true"></i>
                        Compiled Course Cheat Sheet &bull; {tabCounts.all} Essential Shortcuts
                    </div>
                    <h3>Power BI, Power Query &amp; DAX Shortcuts Guide</h3>
                    <p className="shortcut-playbook-subtitle">
                        Practical keyboard shortcuts and a 6-stage Data Model Startup Checklist to speed up ETL, DAX authoring, and dashboard design.
                    </p>
                </div>

                <div className="shortcut-search-wrap">
                    <i className="fa-solid fa-magnifying-glass shortcut-search-icon" aria-hidden="true"></i>
                    <input
                        type="text"
                        className="shortcut-search-input"
                        placeholder="Search shortcuts (e.g. Ctrl + M, bookmark, RLS)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search Power BI shortcuts and checklist"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            className="shortcut-search-clear"
                            onClick={() => setSearchQuery('')}
                            aria-label="Clear search"
                            title="Clear search"
                        >
                            &times;
                        </button>
                    )}
                </div>
            </div>

            <div className="shortcut-category-bar" role="tablist" aria-label="Shortcut categories">
                {TABS.map((tab) => {
                    const isActive = !isSearching && activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            className={`shortcut-cat-pill ${isActive ? 'active' : ''}`}
                            onClick={() => {
                                setSearchQuery('');
                                setActiveTab(tab.id);
                            }}
                        >
                            <i className={tab.icon} aria-hidden="true"></i>
                            <span>{tab.label}</span>
                            <span className="shortcut-cat-count">{tabCounts[tab.id] || 0}</span>
                        </button>
                    );
                })}
            </div>

            {isSearching && (
                <div className="shortcut-search-banner">
                    <span>
                        Showing matches across all categories for <strong>&ldquo;{searchQuery.trim()}&rdquo;</strong>
                    </span>
                    <button
                        type="button"
                        className="shortcut-reset-btn"
                        style={{ padding: '0.32rem 0.7rem', fontSize: '0.8rem' }}
                        onClick={() => setSearchQuery('')}
                    >
                        Clear Filter
                    </button>
                </div>
            )}

            {hasNoResults ? (
                <div className="shortcut-empty-state">
                    <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '2rem', opacity: 0.45, marginBottom: '0.75rem', display: 'block' }}></i>
                    <p style={{ margin: '0 0 0.85rem 0' }}>No shortcuts or checklist items matched &ldquo;{searchQuery}&rdquo;.</p>
                    <button
                        type="button"
                        className="shortcut-reset-btn"
                        onClick={() => {
                            setSearchQuery('');
                            setActiveTab('power-bi');
                        }}
                    >
                        Reset View
                    </button>
                </div>
            ) : (
                <>
                    {visibleGroups.length > 0 && (
                        <div className="shortcut-groups-grid">
                            {visibleGroups.map((group) => (
                                <article key={group.id} className="shortcut-group-card">
                                    <div className="shortcut-group-header">
                                        <div className="shortcut-group-title-wrap">
                                            <span className="shortcut-group-icon" aria-hidden="true">
                                                <i className={group.icon}></i>
                                            </span>
                                            <div>
                                                <h4>{group.title}</h4>
                                            </div>
                                        </div>
                                        <span className="shortcut-group-tag">
                                            {activeTab === 'all' || isSearching ? group.categoryLabel : `${group.items.length} shortcuts`}
                                        </span>
                                    </div>

                                    <div className="shortcut-rows-list">
                                        {group.items.map((item) => {
                                            const isCopied = copiedId === item.id;
                                            return (
                                                <div key={item.id} className="shortcut-row">
                                                    <div className="shortcut-keys-combo">
                                                        {item.keys.map((keyLabel, idx) => (
                                                            <React.Fragment key={`${item.id}-k-${idx}`}>
                                                                {idx > 0 && <span className="shortcut-key-plus">+</span>}
                                                                <kbd className="shortcut-kbd">{keyLabel}</kbd>
                                                            </React.Fragment>
                                                        ))}
                                                    </div>
                                                    <div className="shortcut-desc-wrap">
                                                        <span className="shortcut-desc">{item.desc}</span>
                                                        <button
                                                            type="button"
                                                            className={`shortcut-copy-btn ${isCopied ? 'copied' : ''}`}
                                                            onClick={() => handleCopyShortcut(item)}
                                                            aria-label={isCopied ? 'Copied shortcut' : `Copy ${item.keys.join(' + ')} shortcut`}
                                                            title={isCopied ? 'Copied!' : 'Copy shortcut'}
                                                        >
                                                            <i className={isCopied ? 'fa-solid fa-check' : 'fa-regular fa-copy'}></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    {visibleChecklist.length > 0 && (
                        <div className="checklist-section-block" style={{ marginTop: visibleGroups.length > 0 ? '2rem' : '0.25rem' }}>
                            <div className="checklist-section-title-row">
                                <h4>
                                    <i className="fa-solid fa-clipboard-check" style={{ color: 'var(--primary-color)' }} aria-hidden="true"></i>
                                    Bonus: 6-Stage Data Model Startup Checklist
                                </h4>
                            </div>
                            <div className="checklist-stages-grid">
                                {visibleChecklist.map((stage) => (
                                    <article key={stage.num} className="checklist-stage-card">
                                        <div className="checklist-stage-head">
                                            <span className="checklist-stage-num">{stage.num}</span>
                                            <h5>{stage.title}</h5>
                                        </div>
                                        <ul className="checklist-items-ul">
                                            {stage.steps.map((step) => (
                                                <li key={step.label}>
                                                    <i className="fa-solid fa-circle-check checklist-check-icon" aria-hidden="true"></i>
                                                    <span>
                                                        <strong>{step.label}:</strong> {step.text}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </article>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </section>
    );
};

export default ShortcutDeck;
