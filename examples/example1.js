const fs = require('fs');
const {LabelpointImg, Printer} = require('..'); // only used for this example in subfolder of the package, otherwise use next line instead!
//const {LabelpointImg, Printer} = require('labelpoint-graphics-format');

// create a new Labelpoint image with a width of 80 dots an a height of 50 dot
lpImg = new LabelpointImg(80,50);

// iterate over the image to set each dot
// for this example all dots will be set to 1 = black (use 0 instead for no dot = white)

// line by line
for (let y = 0; y < 50; y++) {
	// dot by dot
	for (let x = 0; x < 80; x++) {
		// set a dot to black 
	    lpImg.addPixel(1);
	}
	// after the last pixel of each line, execute the nextLine comand
	lpImg.nextLine();
}

// show the created data (not needed for printing)
console.log("Created Labelpoint Image as Hex View:\n",lpImg.getBuffer().toString('hex').match(/../g).join(' '));
console.log("File size in bytes: ", lpImg.getBuffer().length);

// save it as file if you want (not needed for printing)
fs.writeFile("exampleImg.G",lpImg.getBuffer(), (e) => {if(e) console.log("Error while saving the file: ",e)});


// Build a complete printjob for sending to the printer
// The image data will be included as Raw Binary Record (RBR)
// for the printer MP compact4 MKII Raw Binary Records are supported with firmware 5.29 (older FW may not support this)

// lablepoint code to send image data to the printer ram
const layout =`
!C  // clear last layout
!C  // make sure to clear last layout
!Y35 99 // UTF-8
!y23 1 0 0 // Origin: 0 from top 50 from left
!F G N 0 280 TR 2 2   // POS: 0 0 // Orienttation: TopLeft // SCALING: 2 2\n
` 

// generate the 3 bytes for a start of a raw binary record "=numberOfByte"
var rbrInit = Buffer.alloc(3);
rbrInit.writeUInt8(0x3D,0); // RBR start symbol "="
rbrInit.writeUInt16BE(lpImg.getBuffer().length,1); // number of bytes in the record (Big Endian)

// labelpoint code to start the printout
const printNow = `\n!P\n`

// put all parts of the printjob in an array of buffers
let printjob = [];
printjob.push(Buffer.from(layout));
printjob.push(rbrInit);
printjob.push(lpImg.getBuffer());
printjob.push(Buffer.from(printNow));

// generate a complete printjob buffer out of the parts
let printjobBuf = Buffer.concat(printjob);

//console.log("Created Printbuffer as Hex View:\n",printjobBuf.toString('hex').match(/../g).join(' '));
//console.log("\nCreated Printbuffer as UTF8 View:\n",printjobBuf.toString('utf8'));

// Create a printer from a name which exists as cups printer on your system
var printer = new Printer('MP4');

// send the printjob to this printer
printer.print(printjobBuf);
printer.print(printjobBuf); // TODO: find out why it only works when sending it twice
