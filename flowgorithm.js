/**
 * FlowgorithmJS
 * @version 0.17a1
 * @date 2020-05-02
 * @author Andrea Vallorani <andrea.vallorani@gmail.com>
 */
var maxW,flowX=0,funX=0;
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
        aT: 7, //arrow tip size
        groupInput: false,
        viewDesc: true, //print description
        itMode: 2, //pre-Iteraction style
        labelTrue: "True",
        labelFalse: "False"
    },options);
    //--
    var $output = $(selector);
    $output.trigger("flowgorithmjs:preload");
    flowX=0,funX=0;
    flow = {Y:0,fWidth:0,dim:[]};
    $output.empty();
    if(options.viewDesc){
        var title = $xml.find('attribute[name=name]').attr('value');
        var desc = $xml.find('attribute[name=about]').attr('value');
        $output.append('<div class="desc" style="margin:0;border-bottom:1px solid #aaa;text-align:left">'+desc+'</div>'+
              '<div class="info" style="padding:.5em 0;font-size:.85em;text-align:left">'+
              '<span class="title"><strong>'+title+'</strong> </span>'+
              '<span class="author">'+$xml.find('attribute[name=authors]').attr('value')+' </span>'+
              '<span class="date">'+$xml.find('attribute[name=saved]').attr('value')+' </span>'+
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
      '    <marker id="arrow" markerWidth="12" markerHeight="12" refX="0" refY="'+(options.aT/2)+'" orient="auto" markerUnits="strokeWidth">'+
      '      <path d="M0,0 L0,'+options.aT+' L'+options.aT+','+(options.aT/2)+' z" fill="#000" />'+
      '    </marker>'+
      '  </defs><text id="ttest" style="visibility:hidden"></text><g id="gtest" style="visibility:hidden"></g></svg>').css('text-align','center');
    //draw flowchart  
    var svg = '';
    $xml.find('function').each(function(){
        svg += drawFunction($(this));
    });
    $svg = $output.children('svg');
    $svg.get(0).innerHTML += '<g transform="translate(0,0)">'+svg+'</g>';
    $svg.children('g').eq(0).remove();
    var gwidth = $svg.children('g').get(0).getBBox().width;
    var gheight = $svg.children('g').get(0).getBBox().height;
    $svg.attr('width',gwidth+10).attr('height',gheight+15).attr('viewBox','0 0 '+(gwidth+10)+' '+(gheight+15));
    var disc = 0-$svg.children('g').get(0).getBBox().x+5;
    $svg.children('g').attr('transform',"translate("+(disc)+",0)");
    $output.trigger("flowgorithmjs:postload");

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
                    txtStart += $(this).attr('type')+' '+$(this).attr('name');
                });
                txtStart += ')';
            }
            txtEnd = 'RETURN '+$xml.attr('variable');
        }
        var s = drawStart(txtStart);
        s += drawSequence($xml.children('body'));
        s += drawEnd(txtEnd);
        var fwidth = calcBlockWidth(s)+5;
        var fx = calcBlockX(s);
        var tempX = funX;
        if(tempX!=0){
            tempX+=fx;
            funX+=fwidth;
        }
        else{
            funX=fwidth-fx;
        }
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
                case 'output':  var outString = $el.attr('expression');
                                if($el.attr('newline')==='False') outString+=' ...';
                                s += drawOutput(outString); break;
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
                case 'more': s += drawMore(); break;
            }
        });
        s += '</g>';
        flow.Y += oldY;
        //console.log("sequence ("+flow.Y+")");
        //if(flow.Y>maxH) maxH = flow.Y;
        //if($xml.children('if').length>0) maxW+=100;
        return s;
    };
    function drawStart(content){
        flow.Y += 20;
        var padding = 10;
        var l = Math.max(calcExtraWidth(content),50)/2+padding;
        var s = '<g class="block" transform="translate(0,'+flow.Y+')">'+
                '  <g class="start">'+
                '    <ellipse class="symbol" cx="0" cy="0" rx="'+l+'" ry="20"/>'+
                '    <text x="0" y="4">'+content+'</text>'+
                '  </g>'+
                '</g>';
        flow.Y += 20;
        return s;
    };
    function drawEnd(content){
        var padding = 10;
        var l = Math.max(calcExtraWidth(content),50)/2+padding;
        var s = '<g class="block" transform="translate(0,'+flow.Y+')">'+
                drawArrow()+
                '  <g class="end" transform="translate(0,'+(options.aH+options.aT+20)+')">'+
                '    <ellipse class="symbol" cx="0" cy="0" rx="'+l+'" ry="20"/>'+
                '    <text x="0" y="4">'+content+'</text>'+
                '  </g>'+
                '</g>';
        flow.Y += 40+options.aH+options.aT;
        return s;
    };
    function drawDeclare(content){
        //console.log("declare ("+flow.Y+")");
        var l = Math.max(calcExtraWidth(content),60)+20;
        var s = '<g class="block" transform="translate(0,'+flow.Y+')">'+
                drawArrow()+
                '  <g class="assign" transform="translate('+(-l/2)+','+(options.aH+options.aT)+')">'+
                '    <rect class="symbol" width="'+l+'" height="36"/>'+
                '    <line class="line" x1="5" y1="0" x2="5" y2="36"/>'+
                '    <line class="line" x1="0" y1="5" x2="'+l+'" y2="5"/>'+
                '    <text x="'+(l/2+3)+'" y="25">'+content+'</text>'+
                '  </g>'+
                '</g>';
        flow.Y += 36+options.aH+options.aT;
        return s;
    };
    function drawAssign(content){
        //console.log("assign ("+flow.Y+")");
        var l = Math.max(calcExtraWidth(content),60)+10;
        var s = '<g class="block" transform="translate(0,'+flow.Y+')">'+
                drawArrow()+
                '  <g class="assign" transform="translate('+(-l/2)+','+(options.aH+options.aT)+')">'+
                '    <rect class="symbol" width="'+(l)+'" height="36"/>'+
                '    <text x="'+(l/2)+'" y="23">'+content+'</text>'+
                '  </g>'+
                '</g>';
        flow.Y += 36+options.aH+options.aT;
        return s;
    };
    function drawInput(content){
        //console.log("input ("+flow.Y+")");
        var l = Math.max(calcExtraWidth(content),50);
        var s = '<g class="block" transform="translate(0,'+flow.Y+')">'+
                drawArrow()+
                '  <g class="input" transform="translate('+(-l/2)+','+(options.aH+options.aT)+')">'+
                '    <polygon class="symbol" points="0,0 -20,36 '+l+',36 '+(20+l)+',0"/>'+
                '    <path class="line" d="M'+(0+l)+',0 q0,15 13,13"/>'+
                '    <text x="'+(l/2)+'" y="23">'+content+'</text>'+
                '    <text class="iotype" x="'+(10+l)+'" y="10">i</text>'+
                '  </g>'+
                '</g>';
        flow.Y += 36+options.aH+options.aT;
        return s;
    };
    function drawOutput(content){
        //console.log("output ("+flow.Y+")");
        var l = Math.max(calcExtraWidth(content),50);
        var s = '<g class="block" transform="translate(0,'+flow.Y+')">'+
                drawArrow()+
                '  <g class="output" transform="translate('+(-l/2)+','+(options.aH+options.aT)+')">'+
                '    <polygon class="symbol" points="0,0 -20,36 '+l+',36 '+(20+l)+',0"/>'+
                '    <path class="line" d="M'+(l)+',0 q0,15 13,13"/>'+
                '    <text x="'+(l/2)+'" y="23">'+content+'</text>'+
                '    <text class="iotype" x="'+(10+l)+'" y="9">o</text>'+
                '  </g>'+
                '</g>';
        flow.Y += 36+options.aH+options.aT;
        return s;
    };
    function drawCall(content){
        var l = Math.max(calcExtraWidth(content),60)+20;
        var s = '<g class="block" transform="translate(0,'+flow.Y+')">'+
                drawArrow()+
                '  <g class="sub-program" transform="translate('+(-l/2)+','+(options.aH+options.aT)+')">'+
                '    <rect class="symbol" width="'+l+'" height="36"/>'+
                '    <line class="line" x1="5" y1="0" x2="5" y2="36"/>'+
                '    <line class="line" x1="'+(l-5)+'" y1="0" x2="'+(l-5)+'" y2="36"/>'+
                '    <text x="'+(l/2)+'" y="23">'+content+'</text>'+
                '  </g>'+
                '</g>';
        flow.Y += 36+options.aH+options.aT;
        return s;
    };
    function drawMore(){
        var text = "...";
        var l = calcExtraWidth(text);
        var s = '<g class="block" transform="translate(0,'+flow.Y+')">'+
                drawArrow()+
                '  <g class="other" transform="translate('+(-l/2)+','+(options.aH+options.aT)+')">'+
                '    <text x="'+(l/2)+'" y="15">'+text+'</text>'+
                '  </g>'+
                '</g>';
        flow.Y += 28+options.aH+options.aT;
        return s;
    };
    function drawEmptyBlock(){
        var s = '<g class="block" transform="translate(0,'+flow.Y+')">'+
                '<polyline class="line" points="0,0 0,'+(options.aH*3)+'" />'+
                '</g>';
        flow.Y += options.aH*3;
        return s;
    };
    function splitCondition(condition){
        var i,tot=0,start=0,nl=false;
        var lines = [];
        for(i=0;i<condition.length;i++){
            if((i+1)%10==0 || nl){
                if(condition.charAt(i)==' ' && i-start>5){
                    lines[tot]=condition.substring(start,i);
                    tot++;
                    start=i+1;
                    nl=false;
                }
                else nl=true;
            } 
        }
        lines[tot]=condition.substring(start);
        //console.log(lines);
        return lines;
    }
    function drawSelection(condition,$branchTrue,$branchFalse){
        var labelTrueSize = Math.max(calcExtraWidth(options.labelTrue),20);
        var labelFalseSize = Math.max(calcExtraWidth(options.labelFalse),20);
        var minPathWidth = Math.max(30,labelTrueSize+5,labelFalseSize+5); //minimum path width
        console.log(labelFalseSize*2);
        var circleRadius = 4; //circle radius of rejoining paths 
        var parts = splitCondition(condition);
        var romH;
        var contidionWidth = 0;
        if(parts.length>1){
            condition = '';
            var nRows = parts.length;
            $(parts).each(function(i){
                contidionWidth = Math.max(calcExtraWidth(this),contidionWidth);
                condition += '<tspan x="0" dy="1.1em">'+this.escape()+'</tspan>';
            });
            contidionWidth += 20*nRows;
            var yc = 11*nRows;
            condition = '<text x="0" y="'+yc+'">'+condition+'</text>';
            romH = 20*nRows;
        }
        else{ 
            contidionWidth = calcExtraWidth(condition);
            condition = '<text x="0" y="32">'+condition.escape()+'</text>';
            romH = 27;
        }
        contidionWidth = Math.max(contidionWidth,50)+30;
        var oldY = 0;
        oldY = flow.Y;
        flow.Y = 0;
        var halfCondition = contidionWidth/2;
        var svgSequenceTrue = '';
        var trueWidth = halfCondition-5;
        if($branchTrue.children().length>0){
            svgSequenceTrue = drawSequence($branchTrue);
            trueWidth+=Math.max(calcBlockX(svgSequenceTrue),minPathWidth);
        }
        else trueWidth+=minPathWidth;
        var s = '<g class="block" transform="translate(0,'+oldY+')">'+
                drawArrow()+
                '  <g class="selection" transform="translate(0,'+(options.aH+options.aT)+')">'+
                '    <g class="condition">'+
                '      <polygon class="symbol" points="0,0 '+halfCondition+','+romH+' 0,'+(romH*2)+' '+(-halfCondition)+','+(romH)+'"/>'+
                        condition+
                '    </g>'+
                '    <g class="arrow-right">'+
                '      <polyline class="line" points="'+halfCondition+','+romH+' '+trueWidth+','+romH+' '+trueWidth+','+(romH+10)+'"/>'+
                '      <text x="'+(halfCondition+labelTrueSize/2)+'" y="'+(romH-5)+'">'+options.labelTrue+'</text>'+
                '    </g>'+
                '    <g class="true-path" transform="translate('+trueWidth+','+(romH+10)+')">'+svgSequenceTrue+'</g>';
        var branchTrueHeight = flow.Y+romH;
        flow.Y = 0;
        var svgSequenceFalse = '';
        var falseWidth = halfCondition-5; 
        if($branchFalse.children().length>0){
            svgSequenceFalse = drawSequence($branchFalse);
            falseWidth += Math.max(calcBlockWidth(svgSequenceFalse)-calcBlockX(svgSequenceFalse),minPathWidth);
        }
        else falseWidth+=minPathWidth;
        s+=     '    <g class="arrow-left">'+
                '      <polyline class="line" points="'+(-halfCondition)+','+romH+' '+(-falseWidth)+','+romH+' '+(-falseWidth)+','+(romH+10)+'"/>'+
                '      <text x="'+(-halfCondition-labelFalseSize/2)+'" y="'+(romH-5)+'">'+options.labelFalse+'</text>'+
                '    </g>'+
                '    <g class="false-path" transform="translate('+(-falseWidth)+','+(romH+10)+')">'+svgSequenceFalse+'</g>';
        var branchFalseHeight = flow.Y+romH;
        if(branchTrueHeight>branchFalseHeight){
            s += '<polyline class="line" points="'+(-falseWidth)+','+(branchFalseHeight+10)+' '+(-falseWidth)+','+(branchTrueHeight+10)+'"/>';
        }
        else if(branchTrueHeight<branchFalseHeight){
            s += '<polyline class="line" points="'+trueWidth+','+(branchTrueHeight+10)+' '+trueWidth+','+(branchFalseHeight+10)+'"/>';
        }
        var endHeight=options.aT+options.aH+3;
        var maxBranchesHeight = Math.max(branchTrueHeight,branchFalseHeight)+10;
        s +=    '    <g class="selection-close" transform="translate(0,'+(maxBranchesHeight)+')">'+
                '      <polyline class="line" points="'+trueWidth+',0 '+trueWidth+','+endHeight+' '+circleRadius+','+endHeight+'"/>'+
                '      <polyline class="line" points="'+(-falseWidth)+',0 '+(-falseWidth)+','+endHeight+' -'+circleRadius+','+endHeight+'"/>'+
                '      <circle class="symbol" cx="0" cy="'+endHeight+'" r="'+circleRadius+'"/>'+
                '    </g>'+
                '  </g>'+
                '</g>';
        flow.Y = oldY+maxBranchesHeight+circleRadius+endHeight+options.aT+options.aH;
        calcBlockWidth(s);
        return s;
    };
    function drawPreIteraction(condition,$content){
        var labelTrueSize = Math.max(calcExtraWidth(options.labelTrue),16);
        var labelFalseSize = Math.max(calcExtraWidth(options.labelFalse),16);
        var parts = splitCondition(condition);
        var romH;
        var contidionWidth=0;
        if(parts.length>1){
            condition = '';
            $(parts).each(function(i){
                contidionWidth = Math.max(calcExtraWidth(this),contidionWidth);
                condition += '<tspan x="0" dy="1.1em">'+this.escape()+'</tspan>';
            });
            contidionWidth += 2*parts.length;
            var yc = parts.length;
            condition = '<text x="0" y="'+yc+'">'+condition+'</text>';
            romH = 9*parts.length;
        }
        else{ 
            contidionWidth = Math.max(calcExtraWidth(condition),60);
            condition = '<text x="0" y="25">'+condition.escape()+'</text>';
            romH = 20;
        }
        var condW2 = contidionWidth/2;
        var s = '<g class="block" transform="translate(0,'+flow.Y+')">'+drawArrow();
        var oldY = flow.Y;
        flow.Y = 0;
        var contentDraw = ($content.children().length>0) ? drawSequence($content) : drawEmptyBlock();
        var contentWidth = calcBlockWidth(contentDraw);
        var half = Math.max(calcBlockX(contentDraw),40);
        s +=    '  <g class="preIteraction" transform="translate(0,'+(options.aH+options.aT)+')">'+
                '    <g class="condition">'+
                '      <polygon class="symbol" points="0,0 '+condW2+',0 '+(condW2+15)+','+romH+' '+condW2+','+(romH*2)+' '+(-condW2)+','+(romH*2)+' '+(-condW2-15)+','+(romH)+' '+(-condW2)+',0"/>'+
                        condition+
                '    </g>';
        //don't use this variant
        if(options.itMode===1){        
            s += '    <g class="true-path" transform="translate('+(condW2+15)+','+(romH)+')">'+
                 '       <polyline class="line" points="0,0 '+half+',0"/>'+
                 '       <text x="10" y="-5">'+options.labelTrue+'</text>'+
                 '       <g class="true-branch" transform="translate('+half+',0)">';
            s += contentDraw;
            s += '           <g class="true-close" transform="translate(0,'+flow.Y+')">'+
                 '               <polyline class="arrow" points="0,0 0,15 '+(-half-15-condW2)+',15 '+(-half-15-condW2)+','+(-flow.Y+romH*2)+'"/>'+
                 '           </g>'+
                 '       </g>'+
                 '    </g>'+
                 '    <g class="false-path" transform="translate('+(-condW2-15)+','+(romH)+')">'+
                 '       <polyline class="line" points="0,0 -25,0 -25,'+flow.Y+' '+(condW2+15)+','+flow.Y+'"/>'+
                 '       <text x="-10" y="-5">'+options.labelFalse+'</text>'+
                 '    </g>'+
                 '  </g>'+
                 '</g>';
            flow.Y += oldY+options.aH+options.aT+20;
        }
        else if(options.itMode===2){
            var down=Math.max(0,romH-options.aH-options.aT);
            s += '    <g class="true-path" transform="translate('+(condW2+15)+','+romH+')">'+
                 '       <polyline class="line" points="0,0 '+(half-5)+',0 '+(half-5)+','+down+'"/>'+
                 '       <text x="'+(labelTrueSize/2+2)+'" y="-5">'+options.labelTrue+'</text>'+
                 '       <g class="true-branch" transform="translate('+(half-5)+','+down+')">';
            s += contentDraw;
            s += '           <g class="true-close" transform="translate(0,'+(flow.Y)+')">'+
                 '               <polyline class="arrow" points="0,0 0,15 '+(-half+15-condW2)+',15 '+(-half+15-condW2)+',0 '+(-half+15-condW2)+','+(-flow.Y+(options.aT*2)+options.aH)+'"/>'+
                 '           </g>'+
                 '       </g>'+
                 '    </g>'+
                 '    <g class="false-path" transform="translate(0,'+(romH*2)+')">'+
                 '       <polyline class="line" points="0,0 0,'+(flow.Y-15)+'"/>'+
                 '       <text x="-'+(labelFalseSize/2+4)+'" y="18">'+options.labelFalse+'</text>'+
                 '    </g>'+
                 '  </g>'+
                 '</g>';
            flow.Y += oldY+(romH*2)+options.aH+options.aT-15;
        }
        else if(options.itMode===3){
            s += '    <g class="true-path" transform="translate(0,'+(romH*2)+')">'+
                 '       <text x="'+(labelTrueSize/2+6)+'" y="14">'+options.labelTrue+'</text>'+
                 '       <g class="true-branch" transform="translate(0,0)">';
            s += contentDraw;
            s += '           <g class="true-close" transform="translate(0,'+flow.Y+')">'+
                 '               <polyline class="arrow" points="0,0 0,10 '+(-half+5-condW2)+',10 '+(-half+5-condW2)+','+(-flow.Y-romH)+' '+(-condW2-25)+','+(-flow.Y-romH)+'"/>'+
                 '           </g>'+
                 '       </g>'+
                 '    </g>'+
                 '    <g class="false-path" transform="translate('+(condW2+15)+','+(romH)+')">'+
                 '       <polyline class="line" points="0,0 '+Math.max((half-condW2),15)+',0 '+Math.max((half-condW2),15)+','+(flow.Y+romH+10+10)+' '+(-condW2-15)+','+(flow.Y+romH+10+10)+'"/>'+
                 '       <text x="'+(labelFalseSize/2+1)+'" y="-5">'+options.labelFalse+'</text>'+
                 '    </g>'+
                 '  </g>'+
                 '</g>';
            flow.Y += oldY+(romH*2)+20+options.aH+options.aT;
        }
        return s;
    };
    function drawPostIteraction(condition,$content){
        var parts = splitCondition(condition);
        var romH;
        var contidionWidth = 0;
        if(parts.length>1){
            condition = '';
            $(parts).each(function(i){
                contidionWidth = Math.max(calcExtraWidth(this),contidionWidth);
                condition += '<tspan x="0" dy="1.1em">'+this.escape()+'</tspan>';
            });
            contidionWidth+=2*parts.length;
            var yc = parts.length;
            condition = '<text x="0" y="'+yc+'">'+condition+'</text>';
            romH = 9*parts.length;
        }
        else{ 
            contidionWidth = calcExtraWidth(condition);
            condition = '<text x="0" y="25">'+condition.escape()+'</text>';
            romH = 20;
        }
        contidionWidth = Math.max(contidionWidth,60);
        var condW2 = contidionWidth/2;
        var s = '<g class="block" transform="translate(0,'+flow.Y+')"><line class="line" x1="0" y1="0" x2="0" y2="'+(options.aH+options.aT)+'"/><circle class="symbol" cx="0" cy="'+(options.aH+options.aT)+'" r="4"/>';
        var oldY = flow.Y;
        flow.Y = 0;
        var contentDraw = ($content.children().length>0) ? drawSequence($content) : drawEmptyBlock();
        var contentWidth = calcBlockWidth(contentDraw);
        var half = Math.max(calcBlockX(contentDraw),condW2+40);
        half+=6;
        flow.Y += 15;
        s +=    '  <g class="postIteraction" transform="translate(0,'+(options.aH+options.aT)+')">';
                
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
            s += '    <polyline class="arrow" points="0,'+(flow.Y)+' 0,14"/>'+
                 '  </g>'+
                 '</g>';
            flow.Y += romH*2;
            flow.Y += oldY+options.aH+options.aT+10;
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
        $('#gtest').get(0).innerHTML = '<g transform="translate(0,0)">'+content+'</g>';
        var l = $('#gtest').children('g').get(0).getBBox().width;
        maxW = Math.max(maxW,l);
        return l;
    };
    function calcBlockX(content){
        $("#gtest").get(0).innerHTML = '<g transform="translate(0,0)">'+content+'</g>';
        return Math.abs($('#gtest').children('g').get(0).getBBox().x);
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