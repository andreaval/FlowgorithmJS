/**
 * FlowgorithmJS
 * @versione 0.13
 */
var maxW,maxH,flowX=0,funX=0;
var flow;
function drawFlowchartFromUrl(url,selector,options){
    $.ajax({
        type: "GET",
        url: url,
        dataType: "xml",
        cache: false,
        success: function(result) {
            drawFlowchart($(result),selector,options);
        }
    });
}
function drawFlowchartFromSource(source,selector,options){
    drawFlowchart($($.parseXML(source)),selector,options);
}
function drawFlowchart($xml,selector,options){
    //default settings
    options = $.extend(true,{
        aH: 12, //arrow length
        groupInput: false,
        viewDesc: true, //print description
        itMode: 2 //pre-Iteraction style
    },options);
    //--
    var $output = $(selector);
    flowX=0,funX=0;
    flow = {Y:0,fWidth:0,dim:[]};
    $output.empty();
    if(options.viewDesc){
        var title = $xml.find('attribute[name=name]').attr('value');
        var desc = $xml.find('attribute[name=about]').attr('value');
        $output.append('<div class="desc" style="margin:0 0 1em;border-bottom:1px solid #aaa;text-align:left">'+desc+'</div><div class="info" style="border:1px dashed #ccc;padding:.5em;font-size:.85em;position:absolute;width:15%;min-width:100px;right:5px">'+
              '<div class="title"><strong>'+title+'</strong></div>'+
              '<div class="author">'+$xml.find('attribute[name=authors]').attr('value')+'</div>'+
              '<div class="date">'+$xml.find('attribute[name=saved]').attr('value')+'</div>'+
              '<a onclick="downloadSVG(\''+selector+'\',\''+title+'.svg\')" style="cursor:pointer;text-decoration:underline;color:red">Download SVG</a>'+
              '</div>');
    }
    $output.append('<svg class="flowchart" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">'+
      '  <style type="text/css"><![CDATA['+
      '  .flowchart{font-size:14px;font-family:Times}'+
      '  .arrow{stroke:#000;stroke-width:1px;marker-end:url(#arrow);fill:none}'+
      '  .line{stroke:#000;stroke-width:1px;fill:none}'+
      '  text{stroke:#000;stroke-width:0;text-anchor:middle}'+
      '  .iotype{font-size:12px;font-style:italic}'+
      '  .symbol{stroke:#000;stroke-width:1px;fill:#fff}'+
      '  ]]></style> '+
      '  <defs>'+
      '    <marker id="arrow" markerWidth="12" markerHeight="12" refX="0" refY="5" orient="auto" markerUnits="strokeWidth">'+
      '      <path d="M0,0 L0,10 L10,5 z" fill="#000" />'+
      '    </marker>'+
      '  </defs><text id="ttest" style="visibility:hidden"></text><g id="gtest" style="visibility:hidden"></g></svg>').css('text-align','center');
    //draw flowchart  
    var svg = '';
    $xml.find('function').each(function(){
        svg += drawFunction($(this));
    });
    $('#ttest').empty().get(0).append(svg);
    var x = $('#ttest').get(0).getBBox().x/100;
    var h = Math.max.apply(Math,flow.dim);
    var w = funX;
    $svg = $output.children('svg');
    $svg.get(0).innerHTML += '<g transform="translate(0,0)">'+svg+'</g>';
    $svg.children('g').eq(0).remove();
    var gwidth = $svg.children('g').get(0).getBBox().width;
    var gheight = $svg.children('g').get(0).getBBox().height;
    $svg.attr('width',gwidth+10).attr('height',gheight+15).attr('viewBox','0 0 '+(gwidth+10)+' '+(gheight+15));
    var disc = 0-$svg.children('g').get(0).getBBox().x+5;
    $svg.children('g').attr('transform',"translate("+(disc)+",0)");

    function drawFunction($xml){
        maxW = 0;
        flow.Y = 0;
        flow.fWidth = 0;
        var name = $xml.attr('name');
        var txtStart,txtEnd;
        if(name==='Main'){
            txtStart = 'START';
            txtEnd = 'END';
        } 
        else{
            txtStart = name;
            var params = $xml.find('parameter');
            if(params.length>0){
                txtStart += '(';
                params.each(function(i){
                    if(i>0) txtStart += ',';
                    txtStart += $(this).attr('name');
                });
                txtStart += ')';
            }
            txtEnd = 'RETURN '+$xml.attr('variable');
        }
        var s = drawStart(txtStart);
        s += drawSequence($xml.children('body'));
        s += drawEnd(txtEnd);
        var tempX = funX;
        funX += (maxW+102);
        if(maxW==0) maxW=2;
        flow.dim.push(flow.Y+20);
        return '<g transform="translate('+(tempX)+',10)" class="function '+name+'">'+s+'</g>';
    };
    function drawSequence($xml){
        var s = '<g class="block sequence" transform="translate(0,'+flow.Y+')">';
        var oldY = flow.Y;
        flow.Y = 0;
        var nextI = -1;
        $xml.children().each(function(i){
            var $el = $(this);
            switch($el.prop("tagName")){
                case 'declare': var array = ($el.attr('array')==="True") ? '['+$el.attr('size')+']' : '';
                                s += drawDeclare($el.attr('type')+' '+$el.attr('name')+array); 
                                break;
                case 'output': s += drawOutput($el.attr('expression')); break;
                case 'input':   if(i>nextI){
                                    var vars = $el.attr('variable');
                                    if(options.groupInput){
                                        nextI = i+1;
                                        while($xml.children().eq(nextI).prop("tagName")=='input'){
                                            vars += ', '+$xml.children().eq(nextI).attr('variable');
                                            nextI++;
                                        }
                                    }
                                    s += drawInput(vars);
                                } break;
                case 'assign': s += drawAssign($el.attr('variable')+'='+$el.attr('expression')); break;
                case 'call': s += drawCall($el.attr('expression')); break;
                case 'if': s += drawSelection($el.attr('expression'),$el.children('then'),$el.children('else')); break;
                case 'for': s += drawPreIteraction($el.attr('variable')+'='+$el.attr('start')+' TO '+$el.attr('end'),$el); break;
                case 'while': s += drawPreIteraction($el.attr('expression'),$el); break;
                case 'do': s += drawPostIteraction($el.attr('expression'),$el); break;
            }
        });
        s += '</g>';
        flow.Y += oldY;
        //console.log("sequence ("+flow.Y+")");
        if(flow.Y>maxH) maxH = flow.Y;
        //if($xml.children('if').length>0) maxW+=100;
        return s;
    };
    function drawStart(content){
        flow.Y += 20;
        var l = Math.max(calcExtraWidth(content)-35,35);
        var s = '<g class="block" transform="translate(0,'+flow.Y+')">'+
                '  <g class="start">'+
                '    <ellipse class="symbol" cx="0" cy="0" rx="'+l+'" ry="20"/>'+
                '    <text x="0" y="5">'+content+'</text>'+
                '  </g>'+
                '</g>';
        flow.Y += 20;
        //console.log("start ("+flow.Y+")");
        return s;
    };
    function drawEnd(content){
        //console.log("end ("+flow.Y+")");
        var l = Math.max(calcExtraWidth(content)-30,35);
        var s = '<g class="block" transform="translate(0,'+flow.Y+')">'+
                drawArrow()+
                '  <g class="end" transform="translate(0,'+(options.aH+30)+')">'+
                '    <ellipse class="symbol" cx="0" cy="0" rx="'+l+'" ry="20"/>'+
                '    <text x="0" y="5">'+content+'</text>'+
                '  </g>'+
                '</g>';
        flow.Y += 50+options.aH;
        return s;
    };
    function drawDeclare(content){
        //console.log("declare ("+flow.Y+")");
        var l = Math.max(calcExtraWidth(content),60)+20;
        var s = '<g class="block" transform="translate(0,'+flow.Y+')">'+
                drawArrow()+
                '  <g class="assign" transform="translate('+(-l/2)+','+(options.aH+10)+')">'+
                '    <rect class="symbol" width="'+l+'" height="36"/>'+
                '    <line class="line" x1="5" y1="0" x2="5" y2="36"/>'+
                '    <line class="line" x1="0" y1="5" x2="'+l+'" y2="5"/>'+
                '    <text x="'+(l/2+3)+'" y="25">'+content+'</text>'+
                '  </g>'+
                '</g>';
        flow.Y += 46+options.aH;
        return s;
    };
    function drawAssign(content){
        //console.log("assign ("+flow.Y+")");
        var l = Math.max(calcExtraWidth(content),60)+10;
        var s = '<g class="block" transform="translate(0,'+flow.Y+')">'+
                drawArrow()+
                '  <g class="assign" transform="translate('+(-l/2)+','+(options.aH+10)+')">'+
                '    <rect class="symbol" width="'+(l)+'" height="36"/>'+
                '    <text x="'+(l/2)+'" y="23">'+content+'</text>'+
                '  </g>'+
                '</g>';
        flow.Y += 46+options.aH;
        return s;
    };
    function drawInput(content){
        //console.log("input ("+flow.Y+")");
        var l = Math.max(calcExtraWidth(content),50);
        var s = '<g class="block" transform="translate(0,'+flow.Y+')">'+
                drawArrow()+
                '  <g class="input" transform="translate('+(-l/2)+','+(options.aH+10)+')">'+
                '    <polygon class="symbol" points="0,0 -20,36 '+l+',36 '+(20+l)+',0"/>'+
                '    <path class="line" d="M'+(0+l)+',0 q0,15 13,13"/>'+
                '    <text x="'+(l/2)+'" y="23">'+content+'</text>'+
                '    <text class="iotype" x="'+(10+l)+'" y="10">i</text>'+
                '  </g>'+
                '</g>';
        flow.Y += 46+options.aH;
        return s;
    };
    function drawOutput(content){
        //console.log("output ("+flow.Y+")");
        var l = Math.max(calcExtraWidth(content),50);
        var s = '<g class="block" transform="translate(0,'+flow.Y+')">'+
                drawArrow()+
                '  <g class="output" transform="translate('+(-l/2)+','+(options.aH+10)+')">'+
                '    <polygon class="symbol" points="0,0 -20,36 '+l+',36 '+(20+l)+',0"/>'+
                '    <path class="line" d="M'+(l)+',0 q0,15 13,13"/>'+
                '    <text x="'+(l/2)+'" y="23">'+content+'</text>'+
                '    <text class="iotype" x="'+(10+l)+'" y="9">o</text>'+
                '  </g>'+
                '</g>';
        flow.Y += 46+options.aH;
        return s;
    };
    function drawCall(content){
        var l = Math.max(calcExtraWidth(content),60)+20;
        var s = '<g class="block" transform="translate(0,'+flow.Y+')">'+
                drawArrow()+
                '  <g class="sub-program" transform="translate('+(-l/2)+','+(options.aH+10)+')">'+
                '    <rect class="symbol" width="'+l+'" height="36"/>'+
                '    <line class="line" x1="5" y1="0" x2="5" y2="36"/>'+
                '    <line class="line" x1="'+(l-5)+'" y1="0" x2="'+(l-5)+'" y2="36"/>'+
                '    <text x="'+(l/2)+'" y="23">'+content+'</text>'+
                '  </g>'+
                '</g>';
        flow.Y += 46+options.aH;
        return s;
    };
    function drawMore(){
        var s = '<g class="block" transform="translate(0,'+flow.Y+')">'+
                drawArrow()+
                '  <g class="other" transform="translate(0,'+(options.aH+10)+')">'+
                '    <text x="50" y="15">...</text>'+
                '  </g>'+
                '</g>';
        flow.Y += 50+options.aH;
        return s;
    };
    function splitCondition(condition){
        condition = condition.replace(/ AND /gi," && ").replace(/ OR /gi," || ");
        var parts = condition.split(/&&|\|\|/);
        var lines = [];
        $(parts).each(function(i){
            var part = $.trim(this);
            if(i<parts.length-1){
                condition = condition.substring(part.length);
                part += condition.substring(0,3);
                condition = condition.substring(4);
            } 
            lines[i] = part;
        });
        //console.log(lines);
        return lines;
    };
    function drawSelection(condition,$branchTrue,$branchFalse){
        var parts = splitCondition(condition);
        var romH;
        if(parts.length>1){
            contidionWidth = 0;
            condition = '';
            var conditionRow = '';
            var nRows = 0;
            $(parts).each(function(i){
                if(conditionRow.length>0) conditionRow += ' ';
                conditionRow += this;
                if(calcExtraWidth(conditionRow)>80){
                    condition += '<tspan x="0" dy="1.1em">'+conditionRow.escape()+'</tspan>';
                    var l = calcExtraWidth(conditionRow);
                    if(contidionWidth<l) contidionWidth=l;
                    conditionRow = '';
                    nRows++;
                }
            });
            contidionWidth += 30*nRows;
            var yc = 10+(16*(nRows-1));
            romH = 22*nRows;
            condition = '<text x="0" y="'+yc+'">'+condition+'</text>';
        }
        else{ 
            var contidionWidth = Math.max(calcExtraWidth(condition),70)+20;
            condition = '<text x="0" y="30">'+condition.escape()+'</text>';
            romH = 25;
        }
        var oldY = 0, maxH = 0;
        oldY = flow.Y;
        flow.Y = 0;
        var halfCondition = contidionWidth/2;
        var svgSequenceTrue = drawSequence($branchTrue);
        var trueWidth = calcBlockX(svgSequenceTrue)+halfCondition-5;
        var s = '<g class="block" transform="translate(0,'+oldY+')">'+
                drawArrow()+
                '  <g class="selection" transform="translate(0,'+(options.aH+10)+')">'+
                '    <g class="condition">'+
                '      <polygon class="symbol" points="0,0 '+halfCondition+','+romH+' 0,'+(romH*2)+' '+(-halfCondition)+','+(romH)+'"/>'+
                        condition+
                '    </g>'+
                '    <g class="arrow-right">'+
                '      <polyline class="line" points="'+halfCondition+','+romH+' '+trueWidth+','+romH+' '+trueWidth+','+(romH+10)+'"/>'+
                '      <text x="'+(halfCondition+10)+'" y="'+(romH-5)+'">T</text>'+
                '    </g>'+
                '    <g class="true-path" transform="translate('+trueWidth+','+(romH+10)+')">'+svgSequenceTrue+'</g>';
        var branchTrueHeight = flow.Y+romH-5;
        //console.log("branch TRUE height: "+branchTrueHeight);
        flow.Y = 0;
        var svgSequenceFalse = '';
        var falseWidth = halfCondition-5; 
        if($branchFalse.children().length>0){
            svgSequenceFalse = drawSequence($branchFalse);
            falseWidth = calcBlockWidth(svgSequenceFalse)-calcBlockX(svgSequenceFalse)+falseWidth;
        }
        else falseWidth+=30;
        s+=     '    <g class="arrow-left">'+
                '      <polyline class="line" points="'+(-halfCondition)+','+romH+' '+(-falseWidth)+','+romH+' '+(-falseWidth)+','+(romH+10)+'"/>'+
                '      <text x="'+(-halfCondition-10)+'" y="'+(romH-5)+'">F</text>'+
                '    </g>'+
                '    <g class="false-path" transform="translate('+(-falseWidth)+','+(romH+10)+')">'+svgSequenceFalse+'</g>';
        var branchFalseHeight = flow.Y+romH-5;
        //console.log("branch FALSE height: "+branchFalseHeight);
        if(branchTrueHeight>branchFalseHeight){
            s += '<polyline class="line" points="'+(-falseWidth)+','+(branchFalseHeight+15)+' '+(-falseWidth)+','+(branchTrueHeight+romH-10)+'"/>';
        }
        else if(branchTrueHeight<branchFalseHeight){
            s += '<polyline class="line" points="'+trueWidth+','+(branchTrueHeight+15)+' '+trueWidth+','+(branchFalseHeight+romH-10)+'"/>';
        }
        var maxBranchesHeight = Math.max(branchTrueHeight,branchFalseHeight);        
        s +=    '    <g class="selection-close" transform="translate(0,'+(maxBranchesHeight+15)+')">'+
                '      <polyline class="line" points="'+trueWidth+',0 '+trueWidth+',25 4,25"/>'+
                '      <polyline class="line" points="'+(-falseWidth)+',0 '+(-falseWidth)+',25 -4,25"/>'+
                '      <circle class="symbol" cx="0" cy="25" r="4"/>'+
                '    </g>'+
                '  </g>'+
                '</g>';
        flow.Y = oldY+maxBranchesHeight+54+options.aH;
        calcBlockWidth(s);
        return s;
    };
    function drawPreIteraction(condition,$content){
        var parts = splitCondition(condition);
        var romH;
        if(parts.length>1){
            contidionWidth = 0;
            condition = '';
            $(parts).each(function(i){
                var part = this;
                condition += '<tspan x="0" dy="1.1em">'+part.escape()+'</tspan>';
                var l = calcExtraWidth(part);
                if(contidionWidth<l) contidionWidth=l;
            });
            contidionWidth+=20+(15*(parts.length-1));
            var yc = 10+(14*(parts.length-1));
            condition = '<text x="0" y="'+yc+'">'+condition+'</text>';
            romH = 15*parts.length;
        }
        else{ 
            var contidionWidth = Math.max(calcExtraWidth(condition),70)+20;
            condition = '<text x="0" y="25">'+condition.escape()+'</text>';
            romH = 20;
        }
        var condW2 = contidionWidth/2;
        var s = '<g class="block" transform="translate(0,'+flow.Y+')">'+drawArrow();
        var oldY = flow.Y;
        flow.Y = 0;
        var contentDraw = drawSequence($content);
        var contentWidth = calcBlockWidth(contentDraw);
        var half = Math.max(calcBlockX(contentDraw),40);
        flow.Y += 25;
        s +=    '  <g class="preIteraction" transform="translate(0,'+(options.aH+10)+')">'+
                '    <g class="condition">'+
                '      <polygon class="symbol" points="0,0 '+condW2+',0 '+(condW2+15)+','+romH+' '+condW2+','+(romH*2)+' '+(-condW2)+','+(romH*2)+' '+(-condW2-15)+','+(romH)+' '+(-condW2)+',0"/>'+
                        condition+
                '    </g>';
        if(options.itMode===1){        
            s += '    <g class="true-path" transform="translate('+(condW2+15)+','+(romH)+')">'+
                 '       <polyline class="line" points="0,0 '+half+',0"/>'+
                 '       <text x="10" y="-5">T</text>'+
                 '       <g class="true-branch" transform="translate('+half+',0)">';
            s += contentDraw;
            s += '           <g class="true-close" transform="translate(0,'+(flow.Y-25)+')">'+
                 '               <polyline class="arrow" points="0,0 0,15 '+(-half-15-condW2)+',15 '+(-half-15-condW2)+','+(-flow.Y+(romH*2)+15)+'"/>'+
                 '           </g>'+
                 '       </g>'+
                 '    </g>'+
                 '    <g class="false-path" transform="translate('+(-condW2-15)+','+(romH)+')">'+
                 '       <polyline class="line" points="0,0 -25,0 -25,'+flow.Y+' '+(condW2+15)+','+flow.Y+'"/>'+
                 '       <text x="-10" y="-5">F</text>'+
                 '    </g>'+
                 '  </g>'+
                 '</g>';
            flow.Y += oldY+options.aH+30;
        }
        else if(options.itMode===2){
            s += '    <g class="true-path" transform="translate('+(condW2+15)+','+(romH)+')">'+
                 '       <polyline class="line" points="0,0 '+(half-5)+',0"/>'+
                 '       <text x="10" y="-5">T</text>'+
                 '       <g class="true-branch" transform="translate('+(half-5)+',0)">';
            s += contentDraw;
            s += '           <g class="true-close" transform="translate(0,'+(flow.Y-25)+')">'+
                 '               <polyline class="arrow" points="0,0 0,15 '+(-half+15-condW2)+',15 '+(-half+15-condW2)+','+(-flow.Y+(romH*2)+15)+'"/>'+
                 '           </g>'+
                 '       </g>'+
                 '    </g>'+
                 '    <g class="false-path" transform="translate(0,'+(romH*2)+')">'+
                 '       <polyline class="line" points="0,0 0,'+flow.Y+'"/>'+
                 '       <text x="-10" y="18">F</text>'+
                 '    </g>'+
                 '  </g>'+
                 '</g>';
            flow.Y += oldY+options.aH+30;
        }
        else if(options.itMode===3){
            s += '    <g class="true-path" transform="translate(0,'+(romH*2)+')">'+
                 '       <text x="10" y="14">T</text>'+
                 '       <g class="true-branch" transform="translate(0,0)">';
            s += contentDraw;
            s += '           <g class="true-close" transform="translate(0,'+(flow.Y-25)+')">'+
                 '               <polyline class="arrow" points="0,0 0,10 '+(-half+10-condW2)+',10 '+(-half+10-condW2)+','+(-flow.Y+5)+' '+(-condW2-25)+','+(-flow.Y+5)+'"/>'+
                 '           </g>'+
                 '       </g>'+
                 '    </g>'+
                 '    <g class="false-path" transform="translate('+(condW2+15)+','+(romH)+')">'+
                 '       <polyline class="line" points="0,0 '+(contentWidth-half)+',0 '+(contentWidth-half)+','+(flow.Y+options.aH)+' '+(-condW2-16)+','+(flow.Y+options.aH)+'"/>'+
                 '       <text x="10" y="-10">F</text>'+
                 '    </g>'+
                 '  </g>'+
                 '</g>';
            flow.Y += oldY+options.aH+43;
        }
        return s;
    };
    function drawPostIteraction(condition,$content){
        var parts = splitCondition(condition);
        var romH;
        if(parts.length>1){
            contidionWidth = 0;
            condition = '';
            $(parts).each(function(i){
                var part = this;
                condition += '<tspan x="0" dy="1.1em">'+part.escape()+'</tspan>';
                var l = calcExtraWidth(part);
                if(contidionWidth<l) contidionWidth=l;
            });
            contidionWidth+=20+(15*(parts.length-1));
            //var yc = 2+(0*(parts.length-1));
            var yc = 2;
            condition = '<text x="0" y="'+yc+'">'+condition+'</text>';
            romH = 10*parts.length;
        }
        else{ 
            var contidionWidth = Math.max(calcExtraWidth(condition),50);
            condition = '<text x="0" y="25">'+condition.escape()+'</text>';
            romH = 20;
        }
        var condW2 = contidionWidth/2;
        var s = '<g class="block" transform="translate(0,'+flow.Y+')"><line class="line" x1="0" y1="0" x2="0" y2="'+(options.aH*2)+'"/><circle class="symbol" cx="0" cy="'+(options.aH*2)+'" r="4"/>';
        var oldY = flow.Y;
        flow.Y = 0;
        var contentDraw = drawSequence($content);
        var contentWidth = calcBlockWidth(contentDraw);
        var half = Math.max(calcBlockX(contentDraw)+10,condW2+30);
        flow.Y += 15;
        s +=    '  <g class="postIteraction" transform="translate(0,'+(options.aH*2)+')">';
                
        if(options.itMode===1 || options.itMode===2 || options.itMode===3){        
            s += '    <g class="true-path" transform="translate(4,0)">'+
                 '       <polyline class="line" points="0,0 '+half+',0"/>'+
                 '       <text x="-17" y="'+(flow.Y-7)+'">T</text>'+
                 '       <g class="true-branch" transform="translate('+half+',0)">';
            s += contentDraw+
                 '           <g class="true-close" transform="translate(0,'+(flow.Y-15)+')">'+
                 '               <polyline class="arrow" points="0,0 0,'+(15+romH)+' '+(-Math.abs(half-condW2-20))+','+(15+romH)+'"/>'+
                 '           </g>';
            s += '       </g>'+
                 '    </g>'+
                 '    <g class="condition" transform="translate(0,'+flow.Y+')">'+
                 '      <polygon class="symbol" points="0,0 '+condW2+',0 '+(condW2+15)+','+romH+' '+condW2+','+(romH*2)+' '+(-condW2)+','+(romH*2)+' '+(-condW2-15)+','+(romH)+' '+(-condW2)+',0"/>'+
                        condition+
                 '       <text x="-12" y="'+(romH*2+15)+'">F</text>'+
                 '       <polyline class="line" points="0,'+(romH*2)+' 0,'+(romH*2+10)+'"/>'+
                 '    </g>';
            s += '    <polyline class="arrow" points="0,'+flow.Y+' 0,14"/>'+
                 '  </g>'+
                 '</g>';
            flow.Y += romH;
            flow.Y += oldY+options.aH+40;
        }
        return s;
    };
    function calcExtraWidth(content){
        $('#ttest').text(content);
        var l = $('#ttest').get(0).getBBox().width;
        maxW = Math.max(maxW,l);
        return l;
    };
    function calcBlockWidth(content){
        $("#gtest").get(0).innerHTML = content;
        var l = $('#gtest').get(0).getBBox().width;
        maxW = Math.max(maxW,l);
        return l;
    };
    function calcBlockX(content){
        $("#gtest").get(0).innerHTML = content;
        return Math.abs($('#gtest').get(0).getBBox().x);
    };
    function drawArrow(){
        return '<line class="arrow" x1="0" y1="0" x2="0" y2="'+options.aH+'"/>';
    };
    function getSVGContents(inputString){
        var domParser = new DOMParser();
        var svgDOM = domParser.parseFromString(inputString,'text/xml').getElementsByTagName('g')[0];
        return svgDOM.innerHTML;
    };
}
function downloadSVG(selector,strFileName){
    var strData = $(selector+' svg').clone().find('#ttest').remove().end();
    strData = strData[0].outerHTML;
    var strMimeType = 'text/plain';
    var D = document,
        A = arguments,
        a = D.createElement("a"),
        d = A[0],
        n = A[1],
        t = A[2] || "text/plain";
    //build download link:
    a.href = "data:" + strMimeType + "charset=utf-8," + escape(strData);
    if (window.MSBlobBuilder) { // IE10
        var bb = new MSBlobBuilder();
        bb.append(strData);
        return navigator.msSaveBlob(bb, strFileName);
    } /* end if(window.MSBlobBuilder) */
    if ('download' in a) { //FF20, CH19
        a.setAttribute("download", n);
        a.innerHTML = "downloading...";
        D.body.appendChild(a);
        setTimeout(function() {
            var e = D.createEvent("MouseEvents");
            e.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            a.dispatchEvent(e);
            D.body.removeChild(a);
        }, 66);
        return true;
    }; /* end if('download' in a) */
    //do iframe dataURL download: (older W3)
    var f = D.createElement("iframe");
    D.body.appendChild(f);
    f.src = "data:" + (A[2] ? A[2] : "application/octet-stream") + (window.btoa ? ";base64" : "") + "," + (window.btoa ? window.btoa : escape)(strData);
    setTimeout(function() {
        D.body.removeChild(f);
    }, 333);
    return false;
};
String.prototype.escape = function() {
    var tagsToReplace = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;'
    };
    return this.replace(/[&<>]/g, function(tag) {
        return tagsToReplace[tag] || tag;
    });
};