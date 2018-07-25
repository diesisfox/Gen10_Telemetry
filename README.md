GenX_Telemetry

To get this app running, follow the following steps:

1. "npm install" to install the dependencies
2. "npm uninstall serialport" to temporarily uninstall serialport
3. "npm run rebuild" to rebuild electron
4. "npm install serialport"
5. "npm run rebuild" to rebuild again

The reason for the rebuilding is that the serialport and electron modules run on 
different node js run-times.


If there is an error with MSBuild or python even after these steps,
run the following global installation:
1. "npm install --global --production windows-build-tools", this might take a while so be patient

If there is an error with python, visit:

https://stackoverflow.com/questions/31251367/node-js-npm-refuses-to-find-python-even-after-python-has-been-set
Keep in mind, node require python 2.7.

One this to note. Once you install windows-build-tools, it will uninstall all other versions of python
2.7. Because of the way that python cannot tolerate empty spaces, a new fresh install of python alongside
windows-build-tools is necessary.