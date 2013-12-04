var system = require("system"),
	page = require("webpage").create(),
	fs = require("fs");

// Read in arguments
var args = ["in", "out", "cssStyles", "paperFormat", "paperOrientation", "paperBorder", "renderDelay"].reduce(function (args, name, i) {
	args[name] = system.args[i + 1]
	return args;
}, {})

page.paperSize = {format: args.paperFormat, orientation: args.paperOrientation, border: args.paperBorder};

page.open(args.in, function(status){
		if (status == "fail") {
			page.close();
			phantom.exit(1);
		}else{
			// Add custom CSS to the page
			page.evaluate(function(css) {
				var head = document.querySelector("head");
				var style = document.createElement("style");
				style.type = "text/css";
				if (style.styleSheet){
					style.styleSheet.cssText = css;
				} else {
					style.appendChild(document.createTextNode(css));
				}
				head.appendChild(style);
			}, args.cssStyles);
			
			window.setTimeout(function(){
				page.render(args.out);
				page.close();
				phantom.exit(0);
			}, parseInt(args.renderDelay, 10));
		}
	});