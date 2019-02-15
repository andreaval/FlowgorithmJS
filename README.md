# FlowgorithmJS
[Flowgorithm (www.flowgorithm.org)](http://www.flowgorithm.org) is an excellent software for drawing flowcharts. 
It use an XML format to output the flowcharts. The XML is saved in files with the **.fprg** extension.

FlowgorithmJS is a **_third-party_** tool written in Javascript that can read and display the .fprg files on a web page using SVG format.

## Include library
```js
<script src="lib/jquery-3.3.1.min.js"></script>
<script src="flowgorithm.js"></script>
```

## Using

```js
drawFlowchartFromSource(xmlString,tagId,options);
```
or

```js
drawFlowchartFromUrl(fprgUrl,tagId,options);
```

## Example
```html
<!DOCTYPE html>
<html>
<head>
  <script src="lib/jquery-3.3.1.min.js"></script>
  <script src="flowgorithm.js"></script>
  <script>
    var xml = '<?xml version="1.0"?>
<flowgorithm fileversion="2.6">
    <attributes>
        <attribute name="name" value="Next number"/>
        <attribute name="authors" value="Andrea Vallorani"/>
        <attribute name="about" value="Print the next of a given number"/>
    </attributes>
    <function name="Main" type="None" variable="">
        <parameters/>
        <body>
            <declare name="N, NEXT" type="Integer" array="False" size=""/>
            <input variable="N"/>
            <assign variable="NEXT" expression="N+1"/>
            <output expression="&quot;Next is &quot; &amp; NEXT"/>
        </body>
    </function>
</flowgorithm>';
    drawFlowchartFromSource(xml,'#f');
  </script>
</head>
<body>
    <div id="f"></div>
</body>
</html>
```
