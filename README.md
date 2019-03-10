# FlowgorithmJS
[Flowgorithm](http://www.flowgorithm.org) is an excellent software for drawing flowcharts. 
To save the work, it use an XML format stored in files with the **.fprg** extension.

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
## Example 1
*http://domain/file.fprg*
```xml
<?xml version="1.0"?>
  <flowgorithm fileversion="2.11">
    <attributes>
      <attribute name="name" value="Next number"/>
      <attribute name="authors" value="Andrea Vallorani"/>
      <attribute name="about" value="Print the next of a given number"/>
      <attribute name="saved" value="2018-01-23 06:36:28 PM"/>
      <attribute name="created" value="YW5kcmVhO3VidW50dTsyMDE4LTAxLTIzOzA1OjMxOjMxIFBNOzI1Njg="/>
      <attribute name="edited" value="YW5kcmVhO3VidW50dTsyMDE4LTAxLTIzOzA2OjM2OjI4IFBNOzQ7MjY5MQ=="/>
    </attributes>
    <function name="Main" type="None" variable="">
      <parameters/>
      <body>
        <declare name="N, NEXT" type="Integer" array="False" size=""/>
        <input variable="N"/>
        <assign variable="NEXT" expression="N+1"/>
        <output expression="NEXT"/>
      </body>
  </function>
</flowgorithm>
```
*http://domain/home.html*
```html
<!DOCTYPE html>
<html>
<head>
  <script src="lib/jquery-3.3.1.min.js"></script>
  <script src="flowgorithm.js"></script>
  <script>
    $(function(){
      drawFlowchartFromUrl('http://domain/file.fprg','#f');
    });
  </script>
</head>
<body>
    <div id="f"></div>
</body>
</html>
```

## Example 2
```html
<!DOCTYPE html>
<html>
<head>
  <script src="lib/jquery-3.3.1.min.js"></script>
  <script src="flowgorithm.js"></script>
  <script>
    var xml = `<?xml version="1.0"?>
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
          <output expression="NEXT"/>
        </body>
      </function>
    </flowgorithm>`;
    $(function(){
      drawFlowchartFromSource(xml,'#f');
    });
  </script>
</head>
<body>
    <div id="f"></div>
</body>
</html>
```

## Demo

* View file from local computer: [https://andreaval.github.io/FlowgorithmJS/drawLocal.html](https://andreaval.github.io/FlowgorithmJS/drawLocal.html)
* View file from online folder: [https://andreaval.github.io/FlowgorithmJS/drawWeb.html](https://andreaval.github.io/FlowgorithmJS/drawWeb.html)
