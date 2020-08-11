// IMPORTANT
// For this example you need to install "node-pngjs" first like this:
// npm install node-pngjs -s

const fs = require('fs');
const PNG = require('pngjs').PNG; // for processing PNG files
const {LabelpointImg, Printer} = require('..'); // only used for this example in subfolder of the package, otherwise use next line instead!
//const {LabelpointImg, Printer} = require('labelpoint-graphics-format');
var spawn = require('child_process').spawn;

 
	var printer = new Printer('MP4');


var lpImg; // for the labelpoint image

// open a PNG file from disk as input image
	fs.createReadStream('lt-test-pic.png')
	    .pipe(new PNG({
	        filterType: 4
	    }))
	    .on('parsed', function() {
	    	
	    	// create a new labelpoint image with size of thee PNG
	    	lpImg = new	LabelpointImg(this.width,this.height);
	    	console.log("Input image width:", this.width, "px, height:",this.height, "px");
	    	// read the PNG line by line
	        for (var y = 0; y < this.height; y++) {
	        	// pixel by pixel
	            for (var x = 0; x < this.width; x++) {
	                var idx = (this.width * y + x) << 2;
	                // each PNG pixel have 3 color channels (3 bytes): one for red, green and blue
	                // we simply take the first color channel.
	                // we add a black dot (=1) to our labelpoint image, if the PNG pixel is darker as 126, otherwhise a white dot(=0)
	                lpImg.addPixel( this.data[idx] >= 127 ? 0 : 1)	
	            }
	            // at end of each line call "nextLine"
	            lpImg.nextLine();
	        }
	
	        // show the created data (not needed for printing)
			// console.log("Created Labelpoint Image as Hex View:\n",lpImg.getBuffer().toString('hex').match(/../g).join(' '));
			console.log("Output image file size:", lpImg.getBuffer().length, "bytes");
			
			// save it as file if you want (not needed for printing)
			var filename = "convert-output.G"
			console.log("Save Output image now as", filename);
			fs.writeFile(filename,lpImg.getBuffer(), (e) => {if(e) console.log("Error while saving the file: ",e)});
	
			printOut();			 
	});

// lablepoint code to send image data to the printer ram
	const layout = ['\n!C',  // clear last layout
				'!C',  // clear last layout, make sure
				'!y23 1 0 0',  // Origin: 0 from top 50 from left
				'!F G N 0 50 TR 1 1\n'  // POS: 0 0 // Orienttation: TopLeft // SCALING: 0 0
		//		'!F G 300 200 L 1 1\n'  // POS: 0 0 // Orienttation: TopLeft // SCALING: 0 0				
				].join('\n') 

// labelpoint code to start the print
	const printNow = "\n!P\n";


// Build a complete printjob for sending to the printer
	function printOut() {
			// The image data will be included as Raw Binary Record (RBR)
			// for the printer model "MP compact4 MKII" Raw Binary Records are supported with firmware 5.29 (older FW may not support this)
					
			// generate the needed 3 bytes at front of a raw binary record "=numberOfByte"
			var rbrInit = Buffer.alloc(3);
			rbrInit.writeUInt8(0x3D,0); // RBR start symbol "="
			rbrInit.writeUInt16BE(lpImg.getBuffer().length,1); // number of bytes in the record (Big Endian)
			
			// put all parts of the printjob in an array of buffers
			let printjob = [Buffer.from(layout),
							rbrInit,
							lpImg.getBuffer(),
							Buffer.from(printNow)];
	
			// generate a complete printjob buffer out of the parts
			let printjobBuf = Buffer.concat(printjob);
			
			//console.log("Created Printbuffer as Hex View:\n",printjobBuf.toString('hex').match(/../g).join(' '));
			//console.log("\nCreated Printbuffer as UTF8 View:\n",printjobBuf.toString('utf8'));
			
			// Create a printer from a name which exists as cups printer on your system (this way is not usabel in windows)
			// the printer does not need to have a driver. use the type "raw" in cups
			var printer = new Printer('MP4Compact');
			
			// send the printjob to this printer
			printer.print(printjobBuf); // TODO: find out why it only works when sending it twice
	}
		
