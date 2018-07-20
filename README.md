GenX_Telemetry

To get this app running, follow the following steps:

1. "npm install" to install the dependencies
2. "npm uninstall serialport" to temporarily uninstall serialport
3. "npm run rebuild" to rebuild electron
4. "npm install serialport"

The reason for the rebuilding is that serialport and electron run on 
different node js run-times.

If there is an error with MSBuild or python even after these steps,
run the following global installation:
1. "npm install --global --production windows-build-tools", this might take a while so be patient