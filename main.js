

function LabelpointImg (width, height) {
	this.width = width;
	this.height = height;
	this.bufferSize = (Math.ceil(this.width/8) * this.height) + 10;
	this.bmpBuffer = Buffer.alloc(this.bufferSize);
	this.bmpBuffer.writeUInt16BE(0x0A00,0); //  predefined startcode for labelpoint Images 
	this.bmpBuffer.writeUInt16LE(this.height,2); //  height in pixels:  (Little Endian)
	this.bmpBuffer.writeUInt16LE(this.width,4); //  width in pixels:   (Little Endian)
	this.bmpBuffer.writeUInt16BE(0x0000,6); //  predifined
	this.bmpBuffer.writeUInt16LE(Math.ceil(width/8),8); // Number of full bytes per image row: (Little Endian)
	this.bufferPos = 10;  //the first 10 bytes a the image header, pixeldata starts at the 11. byte
	this.lastbyte = 0; // the byte which will be composed at the moment 
	this.bitcount = 0; // number of bits added to this bit up to now
	this.wCount = 0; // keep track of the x position of the current pixel
}

// Arg  pixel: 0 (white) or 1 (black)
LabelpointImg.prototype.addPixel = function (pixel) {
	if (this.wCount++ >= this.width) return; // ignore pixels outside the pic width 
	if (this.bitcount++ < 8) {
		this.lastbyte <<= 1; // push the bits to the left
		this.lastbyte += pixel; // add the new pixel as bit
		if (this.bitcount == 8) { // write the byte if 8 bits were set
				if (this.bufferPos < this.bufferSize) this.bmpBuffer.writeUInt8(this.lastbyte,this.bufferPos++); //  Image Data
				this.lastbyte = 0;
				this.bitcount = 0;
		}
	}
}

// make sure the last byte of the current line will be written correctly, even if the byte was not full (width / 8 = float)
LabelpointImg.prototype.nextLine = function () {
	if (this.bitcount > 0) {
		this.lastbyte <<= (8 - this.bitcount)  // shift the rest of the byte with zeros
		if (this.bufferPos < this.bufferSize) this.bmpBuffer.writeUInt8(this.lastbyte,this.bufferPos++); //  write the byte  
		this.lastbyte = 0;
		this.bitcount = 0;
		this.wCount = 0;
	}
}

LabelpointImg.prototype.getBuffer = function () {
		return this.bmpBuffer;
}


// Helper Function to send some Data the a raw line print (lp) printer on unix/linux systems with cups 
// the printer have to be added as raw printer in cups

var spawn = require('child_process').spawn;

// Initialize with the printername used in cups
// const MPcompact4 = new Printer ("MPcompact4");

function Printer(name) {
  this.name = name;
}

// send the printjob to the printer
// if the printjob consists of multible parts, put the parts in an array!!
// MPcompact4.print(dataToPrint); 
Printer.prototype.print = function(data) {
  var args = [];
  args.push('-d', this.name);
  var lp = spawn('lp', args);

  if (Array.isArray(data)) {
  	for (var i = 0; i < data.length; i++) {
  		lp.stdin.write(data[i]);
  	}
  } else {
  	  lp.stdin.write(data);
  }
  lp.stdin.end();

};

module.exports = LabelpointImg;
module.exports = Printer;
