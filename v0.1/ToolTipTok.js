const ToolTipAttr = (() => {
    const scriptName = "ToolTipAttr";
    const version = '0.1';
    
    const checkInstall = () =>  {
        log(scriptName + ' v' + version + ' initialized.');
    };
    
    const handleAttrChange = function(obj, prev) {
        
        const decodeUnicode = (str) => str.replace(/%u[0-9a-fA-F]{2,4}/g, (m) => String.fromCharCode(parseInt(m.slice(2), 16)));
        
        let charID = obj.get('_characterid');
        let char = getObj('character', charID);
        
        if (char) {
            let toks = findObjs({                             
                _type: 'graphic',
                represents: charID
            });
            
            if (toks.length > 0) {
                let attrs = findObjs({                             
                    _type: 'attribute',
                    _characterid: charID
                });
                
                if (attrs) {
                    toks.forEach (tok => {
                        let gmNotes = unescape(decodeUnicode(tok.get('gmnotes')));
                        
                        let notesArr = gmNotes.split('</p>').map(e => e.replace('<p>',''));
                        if (notesArr) {
                            let tooltipLine = notesArr.filter(s => s.toLowerCase().includes('tooltip:'))[0];
                            
                            if (tooltipLine) {
                                let placeholderArr = tooltipLine.match(/@{(.*?)}/g);    //returns array [@{attr1}, @{attr2}...]
                                let tooltipStr = tooltipLine.split('tooltip:')[1].trim();   //returns the structure of the text to be in tooltip, with placeholders e.g. "@{hp} / @{hp|max}"
                                let attrNames = tooltipStr.match(/(?<=\{).+?(?=\})/g);   //returns an array of attributeNames between {}, e.g. [hp, hp|max]
                                
                                if(attrNames) {
                                    attrNames.forEach((name, i) => {
                                        let currentOrMax = 'current';
                                        if (name.toLowerCase().indexOf('|max') > 0) {
                                            name = name.toLowerCase().split('|max')[0];
                                            currentOrMax = 'max';
                                        }
                                        let attribute = attrs.filter(a => a.get('name')===name);
                                        
                                        if (attribute.length > 0) {
                                            tooltipStr = tooltipStr.replace(placeholderArr[i], attribute[0].get(currentOrMax) || 'undefined');
                                        } else {
                                            tooltipStr = tooltipStr.replace(placeholderArr[i], 'undefined');
                                        }
                                    });
                                    tok.set('tooltip', tooltipStr);
                                } else {
                                    tok.set('tooltip', 'undefined');
                                }
                                
                            }
                        }
                    });
                }
            }
        }
    }
    
    const registerEventHandlers = () => {
        //manual change of attribute
        on('change:attribute', handleAttrChange);
        on('add:attribute', handleAttrChange);
        
        //register this script to ChatSetAttr
        try {
            ChatSetAttr.registerObserver('change', handleAttrChange);
        } catch (error) {
            sendChat(scriptName, `/w gm Unable to register ${scriptName} to ChatSetAttr. Install ChatSetAttr for full functionality`);
        }
        
        //register this script to TokenMod to handle linked bars/attributes
        if('undefined' !== typeof TokenMod && TokenMod.ObserveTokenChange){
            TokenMod.ObserveTokenChange(function(obj,prev){
                let attr;
                if(obj.get('bar1_value') !== prev.bar1_value && obj.get('bar1_link') !== '') {
                    attr = getObj('attribute', obj.get('bar1_link'));
                } else if(obj.get('bar2_value') !== prev.bar2_value && obj.get('bar2_link') !== '') {
                    attr = getObj('attribute', obj.get('bar2_link'));
                } else if(obj.get('bar3_value') !== prev.bar3_value && obj.get('bar3_link') !== '') {
                    attr = getObj('attribute', obj.get('bar3_link'));
                }
                if (attr) {
                    handleAttrChange(attr, {})
                }
            });
        } else {
            sendChat(scriptName, `/w gm Unable to register ${scriptName} to Token-mod. Install Token-mod for full functionality`);
        }
    };
    
    on('ready', () => {
        checkInstall();
        registerEventHandlers();
    });
})();
