/**
 * export layers to html  //导出图层到html
 * exports photoshop layers as .png or .jpg;   //导出图层为png或者jpg
 * also creates html, css & json for the images,   //生成html，css，json
 * within absolutely positioned divs.
 *
 * usage: open a photoshop doc; in the File menu, navigate to scripts -> browse.
 *        navigate to this script and open it.
 *        Select your export options and destination in the
 *        dialog box, click 'run'. Files will be created
 */

/**
 * Adobe's 'export layers to files.jsx' substantially refactored
 * export layers to files.jsx copyright 2007 Adobe Systems, Incorporated
 * export layers to files.jsx written by Naoki Hada 2007
 * export layers to files.jsx ZStrings and auto layout by Tom Ruark
 */

/**
 * this script copyright 2011 Ken Penn, http://kpenn.com/
 * licensed under the GPL license
 */

// enable double clicking from Mac Finder or Windows Explorer
// if you need to jslint this, comment out the '#target' line below
#target photoshop

// debug level: 0-2 (0:disable, 1:break on error, 2:break at beginning)
// $.level = 2;
// debugger; // launch debugger on next line

// on localized builds we pull the $$$/Strings from a .dat file, see documentation for more details
$.localize = true;

// global variables
var layerindex = 0; //全局字符下标变量
var strTitle = ("Export Layers To HTML");
var strButtonRun = localize("$$$/JavaScripts/ExportLayersToFiles/Run=Run");
var strButtonCancel = localize("$$$/JavaScripts/ExportLayersToFiles/Cancel=Cancel");
var strHelpText = localize("$$$/JavaScripts/ExportLayersToFiles/Help=Please specify the format and location for saving each layer as a file.");
var strLabelDestination = localize("$$$/JavaScripts/ExportLayersToFiles/Destination=Destination:");
var strButtonBrowse = localize("$$$/JavaScripts/ExportLayersToFiles/Browse=&Browse...");
var strLabelFileNamePrefix = localize("$$$/JavaScripts/ExportLayersToFiles/FileNamePrefix=File Name Prefix:");
var strCheckboxVisibleOnly = localize("$$$/JavaScripts/ExportLayersToFiles/VisibleOnly=&Visible Layers Only");
var strLabelFileType = localize("$$$/JavaScripts/ExportLayersToFiles/FileType=File Type:");
var strCheckboxIncludeICCProfile = localize("$$$/JavaScripts/ExportLayersToFiles/IncludeICC=&Include ICC Profile");
var strJPEGOptions = localize("$$$/JavaScripts/ExportLayersToFiles/JPEGOptions=JPEG Options:");
var strLabelQuality = localize("$$$/JavaScripts/ExportLayersToFiles/Quality=Quality:");
var strCheckboxMaximizeCompatibility = localize("$$$/JavaScripts/ExportLayersToFiles/Maximize=&Maximize Compatibility");
var strLabelEncoding = localize("$$$/JavaScripts/ExportLayersToFiles/Encoding=Encoding:");
var strLabelDepth = localize("$$$/JavaScripts/ExportLayersToFiles/Depth=Depth:");
var strRadiobutton16bit = localize("$$$/JavaScripts/ExportLayersToFiles/Bit16=16bit");
var strRadiobutton24bit = localize("$$$/JavaScripts/ExportLayersToFiles/Bit24=24bit");
var strRadiobutton32bit = localize("$$$/JavaScripts/ExportLayersToFiles/Bit32=32bit");
var strAlertSpecifyDestination = localize("$$$/JavaScripts/ExportLayersToFiles/SpecifyDestination=Please specify destination.");
var strAlertDestinationNotExist = localize("$$$/JavaScripts/ExportLayersToFiles/DestionationDoesNotExist=Destination does not exist.");
var strTitleSelectDestination = localize("$$$/JavaScripts/ExportLayersToFiles/SelectDestination=Select Destination");
var strAlertDocumentMustBeOpened = localize("$$$/JavaScripts/ExportLayersToFiles/OneDocument=You must have a document open to export!");
var strAlertNeedMultipleLayers = localize("$$$/JavaScripts/ExportLayersToFiles/NoLayers=You need a document with multiple layers to export!");
var strAlertWasSuccessful = localize("$$$/JavaScripts/ExportLayersToFiles/Success= was successful.");
var strUnexpectedError = localize("$$$/JavaScripts/ExportLayersToFiles/Unexpected=Unexpected error");
var strMessage = localize("$$$/JavaScripts/ExportLayersToFiles/Message=Export Layers To Files action settings");
var stretQuality = localize("$$$/locale_specific/JavaScripts/ExportLayersToFiles/ETQualityLength=30");
var stretDestination = localize("$$$/locale_specific/JavaScripts/ExportLayersToFiles/ETDestinationLength=160");
var strddFileType = localize("$$$/locale_specific/JavaScripts/ExportLayersToFiles/DDFileType=100");
var strpnlOptions = localize("$$$/locale_specific/JavaScripts/ExportLayersToFiles/PNLOptions=100");
var strPNG8Options = localize("$$$/JavaScripts/ExportLayersToFiles/PNG8Options=PNG-8 Options:");
var strCheckboxPNGTransparency = localize("$$$/JavaScripts/ExportLayersToFiles/Transparency=Transparency");
var strCheckboxPNGInterlaced = localize("$$$/JavaScripts/ExportLayersToFiles/Interlaced=Interlaced");
var strCheckboxPNGTrm = localize("$$$/JavaScripts/ExportLayersToFiles/Trim=Trim Layers");
var strPNG24Options = localize("$$$/JavaScripts/ExportLayersToFiles/PNG24Options=PNG-24 Options:");

// set the photoshop ruler pref to pixels   //把ps尺寸设置为像素单位
var originalUnit = preferences.rulerUnits;

preferences.rulerUnits = Units.PIXELS;

// the drop down list indexes for file type

var png24Index = 0;
var png8Index = 1;
var jpegIndex = 2;

// ok and cancel button
var runButtonID = 1;
var cancelButtonID = 2;

// kpedt hoisted; was previously an undeclared global
var dlgMain;

// several globals to capture export vars for the text files

var exportHeader = {
	psdName: '',
	psdWidth: 0,
	psdHeight: 0,
	extension: '',
	prefix: '',
	outDir: '',
	imgDir: 'imgs',
	cssDir: 'css'
};



// the array of image data to export, and its index //图片数据数组，用来导出的还有他的下标
var exportImageData = [];
var imgIdx = 0;

// main function calls all the others //主函数入口
main();

/**
 * Function:  strToIntWithDefault
 *   Usage: convert a string to a number, first stripping all characters
 *   Input: string and a default number
 *   Return: a number
 */
function strToIntWithDefault(s, n) { //把字符串转换为数字

	var onlyNumbers = /[^0-9]/g,
		t = s.replace(onlyNumbers, '');

	t = parseInt(t, 10);

	if (!isNaN(t)) {
		n = t;
	}

	return n;
}

/**
 * Function: webStr
 *   Usage: creates a web-safe string
 *   Input: psd file name or layer name
 *   Return: web-safe string
 *   not too DRY, but the regex was unwieldy and error-prone
 */
function webStr(strIn) { //把psd文件名转换为web安全的字符
	var ch,
		idx = 0,
		len = strIn.length > 120 ? 120 : strIn.length,
		strOut = '';

	for (idx; idx < len; idx += 1) {

		ch = strIn.charAt(idx).toUpperCase();
		if (ch >= 'A' && ch <= 'Z') {
			strOut += strIn.charAt(idx);
		} else if (ch >= '0' && ch <= '9') {
			strOut += strIn.charAt(idx);
		} else if (ch === '_' || ch === '-') {
			strOut += strIn.charAt(idx);
		} else {
			if (idx === 0) {
				strOut += 'x';
			} else {
				strOut += '-';
			}
		}
	}
	return strOut;
}

/**
 * Function: settingDialog
 *   Usage: pop the ui and get user settings
 *   Input: exportInfo object containing our parameters
 *   Return: on ok, the dialog info is set to the exportInfo object
 */
function settingDialog(exportInfo) { //设置对话框

	var brush,
		destination,
		result,
		testFolder;

	dlgMain = new Window('dialog', strTitle);

	// match our dialog background color to the host application
	brush = dlgMain.graphics.newBrush(dlgMain.graphics.BrushType.THEME_COLOR, 'appDialogBackground');
	dlgMain.graphics.backgroundColor = brush;
	dlgMain.graphics.disabledBackgroundColor = dlgMain.graphics.backgroundColor;

	dlgMain.orientation = 'column';
	dlgMain.alignChildren = 'left';

	// -- top of the dialog, first line
	dlgMain.add('statictext', undefined, strLabelDestination);

	// -- two groups, one for left and one for right ok, cancel
	dlgMain.grpTop = dlgMain.add('group');
	dlgMain.grpTop.orientation = 'row';
	dlgMain.grpTop.alignChildren = 'top';
	dlgMain.grpTop.alignment = 'fill';

	// -- group top left
	dlgMain.grpTopLeft = dlgMain.grpTop.add('group');
	dlgMain.grpTopLeft.orientation = 'column';
	dlgMain.grpTopLeft.alignChildren = 'left';
	dlgMain.grpTopLeft.alignment = 'fill';

	// -- the second line in the dialog
	dlgMain.grpSecondLine = dlgMain.grpTopLeft.add('group');
	dlgMain.grpSecondLine.orientation = 'row';

	dlgMain.etDestination = dlgMain.grpSecondLine.add('edittext', undefined, exportInfo.destination.toString());

	dlgMain.etDestination.alignment = 'fill';
	dlgMain.etDestination.preferredSize.width = strToIntWithDefault(stretDestination, 160);

	dlgMain.btnBrowse = dlgMain.grpSecondLine.add('button', undefined, strButtonBrowse);

	dlgMain.btnBrowse.alignment = 'right';

	dlgMain.btnBrowse.onClick = function() {
		var defaultFolder = dlgMain.etDestination.text;
		testFolder = new Folder(dlgMain.etDestination.text);
		if (!testFolder.exists) {
			defaultFolder = '~';
		}
		var selFolder = Folder.selectDialog(strTitleSelectDestination, defaultFolder);
		if (selFolder != null) {
			dlgMain.etDestination.text = selFolder.fsName;
		}
		dlgMain.defaultElement.active = true;
	};

	// -- the third line in the dialog
	dlgMain.grpTopLeft.add('statictext', undefined, strLabelFileNamePrefix);

	// -- the fourth line in the dialog
	dlgMain.etFileNamePrefix = dlgMain.grpTopLeft.add('edittext', undefined, exportInfo.fileNamePrefix.toString());
	dlgMain.etFileNamePrefix.alignment = 'fill';
	dlgMain.etFileNamePrefix.preferredSize.width = strToIntWithDefault(stretDestination, 160);

	// option has been removed, force export visible only

	// -- the fifth line in the dialog
	dlgMain.grpTopLeft.add('statictext', undefined, strCheckboxVisibleOnly);


	// -- the sixth line is the panel
	dlgMain.pnlFileType = dlgMain.grpTopLeft.add('panel', undefined, strLabelFileType);
	dlgMain.pnlFileType.alignment = 'fill';

	// -- now a dropdown list
	dlgMain.ddFileType = dlgMain.pnlFileType.add('dropdownlist');
	dlgMain.ddFileType.preferredSize.width = strToIntWithDefault(strddFileType, 100);
	dlgMain.ddFileType.alignment = 'left';

	// file types in the dropdown
	dlgMain.ddFileType.add('item', 'PNG-24');
	dlgMain.ddFileType.add('item', 'PNG-8');
	dlgMain.ddFileType.add('item', 'JPEG');

	dlgMain.ddFileType.onChange = function() {
		hideAllFileTypePanel();
		switch (this.selection.index) {

			case png24Index:
				dlgMain.pnlFileType.pnlOptions.text = strPNG24Options;
				dlgMain.pnlFileType.pnlOptions.grpPNG24Options.show();
				break;

			case png8Index:
				dlgMain.pnlFileType.pnlOptions.text = strPNG8Options;
				dlgMain.pnlFileType.pnlOptions.grpPNG8Options.show();
				break;

			case jpegIndex:
				dlgMain.pnlFileType.pnlOptions.text = strJPEGOptions;
				dlgMain.pnlFileType.pnlOptions.grpJPEGOptions.show();
				break;
		}
	};

	dlgMain.ddFileType.items[exportInfo.fileType].selected = true;

	// -- now after all the radio buttons
	dlgMain.cbIcc = dlgMain.pnlFileType.add('checkbox', undefined, strCheckboxIncludeICCProfile);
	dlgMain.cbIcc.value = exportInfo.icc;
	dlgMain.cbIcc.alignment = 'left';

	// -- now the options panel that changes
	dlgMain.pnlFileType.pnlOptions = dlgMain.pnlFileType.add('panel', undefined, 'Options');
	dlgMain.pnlFileType.pnlOptions.alignment = 'fill';
	dlgMain.pnlFileType.pnlOptions.orientation = 'stack';
	dlgMain.pnlFileType.pnlOptions.preferredSize.height = strToIntWithDefault(strpnlOptions, 100);

	// PNG8 options
	dlgMain.pnlFileType.pnlOptions.grpPNG8Options = dlgMain.pnlFileType.pnlOptions.add('group');
	dlgMain.pnlFileType.pnlOptions.grpPNG8Options.png8Trans = dlgMain.pnlFileType.pnlOptions.grpPNG8Options.add('checkbox', undefined, strCheckboxPNGTransparency.toString());
	dlgMain.pnlFileType.pnlOptions.grpPNG8Options.png8Inter = dlgMain.pnlFileType.pnlOptions.grpPNG8Options.add('checkbox', undefined, strCheckboxPNGInterlaced.toString());
	dlgMain.pnlFileType.pnlOptions.grpPNG8Options.png8Trm = dlgMain.pnlFileType.pnlOptions.grpPNG8Options.add('checkbox', undefined, strCheckboxPNGTrm.toString());
	dlgMain.pnlFileType.pnlOptions.grpPNG8Options.png8Trans.value = exportInfo.png8Transparency;
	dlgMain.pnlFileType.pnlOptions.grpPNG8Options.png8Inter.value = exportInfo.png8Interlaced;
	dlgMain.pnlFileType.pnlOptions.grpPNG8Options.png8Trm.value = exportInfo.png8Trim;
	dlgMain.pnlFileType.pnlOptions.grpPNG8Options.visible = (exportInfo.fileType == png8Index);

	// PNG24 options
	dlgMain.pnlFileType.pnlOptions.grpPNG24Options = dlgMain.pnlFileType.pnlOptions.add('group');
	dlgMain.pnlFileType.pnlOptions.grpPNG24Options.png24Trans = dlgMain.pnlFileType.pnlOptions.grpPNG24Options.add('checkbox', undefined, strCheckboxPNGTransparency.toString());
	dlgMain.pnlFileType.pnlOptions.grpPNG24Options.png24Inter = dlgMain.pnlFileType.pnlOptions.grpPNG24Options.add('checkbox', undefined, strCheckboxPNGInterlaced.toString());
	dlgMain.pnlFileType.pnlOptions.grpPNG24Options.png24Trm = dlgMain.pnlFileType.pnlOptions.grpPNG24Options.add('checkbox', undefined, strCheckboxPNGTrm.toString());
	dlgMain.pnlFileType.pnlOptions.grpPNG24Options.png24Trans.value = exportInfo.png24Transparency;
	dlgMain.pnlFileType.pnlOptions.grpPNG24Options.png24Inter.value = exportInfo.png24Interlaced;
	dlgMain.pnlFileType.pnlOptions.grpPNG24Options.png24Trm.value = exportInfo.png24Trim;
	dlgMain.pnlFileType.pnlOptions.grpPNG24Options.visible = (exportInfo.fileType == png24Index);

	// JPEG options
	dlgMain.pnlFileType.pnlOptions.grpJPEGOptions = dlgMain.pnlFileType.pnlOptions.add('group');
	dlgMain.pnlFileType.pnlOptions.grpJPEGOptions.add('statictext', undefined, strLabelQuality);
	dlgMain.pnlFileType.pnlOptions.grpJPEGOptions.etQuality = dlgMain.pnlFileType.pnlOptions.grpJPEGOptions.add('edittext', undefined, exportInfo.jpegQuality.toString());
	dlgMain.pnlFileType.pnlOptions.grpJPEGOptions.etQuality.preferredSize.width = strToIntWithDefault(stretQuality, 30);
	dlgMain.pnlFileType.pnlOptions.grpJPEGOptions.visible = (exportInfo.fileType == jpegIndex);

	// the right side of the dialog, the ok and cancel buttons
	dlgMain.grpTopRight = dlgMain.grpTop.add('group');
	dlgMain.grpTopRight.orientation = 'column';
	dlgMain.grpTopRight.alignChildren = 'fill';

	dlgMain.btnRun = dlgMain.grpTopRight.add('button', undefined, strButtonRun);

	dlgMain.btnRun.onClick = function() {

		destination = dlgMain.etDestination.text;
		if (destination.length == 0) {
			alert(strAlertSpecifyDestination);
			return;
		}
		testFolder = new Folder(destination);
		if (!testFolder.exists) {
			alert(strAlertDestinationNotExist);
			return;
		}

		dlgMain.close(runButtonID);
	};

	dlgMain.btnCancel = dlgMain.grpTopRight.add('button', undefined, strButtonCancel);

	dlgMain.btnCancel.onClick = function() {
		dlgMain.close(cancelButtonID);
	};

	dlgMain.defaultElement = dlgMain.btnRun;
	dlgMain.cancelElement = dlgMain.btnCancel;

	// the bottom of the dialog
	dlgMain.grpBottom = dlgMain.add('group');
	dlgMain.grpBottom.orientation = 'column';
	dlgMain.grpBottom.alignChildren = 'left';
	dlgMain.grpBottom.alignment = 'fill';

	dlgMain.pnlHelp = dlgMain.grpBottom.add('panel');
	dlgMain.pnlHelp.alignment = 'fill';

	dlgMain.etHelp = dlgMain.pnlHelp.add('statictext', undefined, strHelpText, {
		multiline: true
	});
	dlgMain.etHelp.alignment = 'fill';

	dlgMain.onShow = function() {
		dlgMain.ddFileType.onChange();
	};

	// give the hosting app the focus before showing the dialog
	app.bringToFront();

	dlgMain.center();

	result = dlgMain.show();

	if (cancelButtonID == result) {
		return result; // close to quit
	}

	// get setting from dialog
	exportInfo.destination = dlgMain.etDestination.text;
	// kpedt force valid prefix for html
	if (!dlgMain.etFileNamePrefix.text.length) {
		exportInfo.fileNamePrefix = 'x';
	} else {
		exportInfo.fileNamePrefix = webStr(dlgMain.etFileNamePrefix.text);
	}
	// kpedt force visible only
	exportInfo.visibleOnly = true;
	exportInfo.fileType = dlgMain.ddFileType.selection.index;
	exportInfo.icc = dlgMain.cbIcc.value;
	exportInfo.jpegQuality = dlgMain.pnlFileType.pnlOptions.grpJPEGOptions.etQuality.text;

	return result;
}

/**
 * Function: hideAllFileTypePanel //隐藏所以的文档类型面板
 *   Usage: hide all the panels in the common actions
 *   Input: <none>, dlgMain is a global for this script
 *   Return: <none>, all panels are now hidden
 */
function hideAllFileTypePanel() {
	dlgMain.pnlFileType.pnlOptions.grpJPEGOptions.hide();
	dlgMain.pnlFileType.pnlOptions.grpPNG8Options.hide();
	dlgMain.pnlFileType.pnlOptions.grpPNG24Options.hide();
}

/**
 * Function: initExportInfo
 *   Usage: create our default parameters
 *   Input: a new Object
 *   Return: a new object with params set to default
 */
function initExportInfo(exportInfo) { //初始化导出信息

	var tmp;

	exportInfo.destination = '';
	exportInfo.fileNamePrefix = 'export-';
	exportInfo.visibleOnly = false;
	exportInfo.fileType = png24Index;
	exportInfo.icc = true;
	exportInfo.jpegQuality = 8;
	exportInfo.psdMaxComp = true;
	exportInfo.png24Transparency = true;
	exportInfo.png24Interlaced = false;
	exportInfo.png24Trim = true;
	exportInfo.png8Transparency = true;
	exportInfo.png8Interlaced = false;
	exportInfo.png8Trim = true;

	try {
		exportInfo.destination = new Folder(app.activeDocument.fullName.parent).fsName; // destination folder //目标目录
		tmp = app.activeDocument.fullName.name;
		exportInfo.fileNamePrefix = decodeURI(tmp.substring(0, tmp.indexOf('.'))); // filename body part  文件名称
	} catch (someError) {
		exportInfo.destination = '';
		exportInfo.fileNamePrefix = app.activeDocument.name; // filename body part
	}
}

/**
 * Function: saveFile
 *   Usage: the worker routine, take our params and save the file accordingly
 *   Input: reference to the document, the name of the output file,
 *        export info object containing more information, the exported image info
 *   Return: <none>, a file on disk
 */
function saveFile(docRef, fileNameBody, exportInfo) { //保存文档

	var fileToSave;

	switch (exportInfo.fileType) {

		case jpegIndex:
			docRef.bitsPerChannel = BitsPerChannelType.EIGHT;
			fileToSave = new File(exportInfo.destination +'/'+ exportHeader.imgDir+ '/' + fileNameBody + '.jpg');
			jpgSaveOptions = new JPEGSaveOptions();
			jpgSaveOptions.embedColorProfile = exportInfo.icc;
			jpgSaveOptions.quality = exportInfo.jpegQuality;
			docRef.saveAs(fileToSave, jpgSaveOptions, true, Extension.LOWERCASE);
			break;

		case png8Index:
			savePng8(fileNameBody, exportInfo, dlgMain.pnlFileType.pnlOptions.grpPNG24Options.png24Inter.value, dlgMain.pnlFileType.pnlOptions.grpPNG24Options.png24Trans.value);
			//var saveFile = new File(exportInfo.destination + '/' + fileNameBody + '.png');

			break;

		case png24Index:
			savePng24(fileNameBody, exportInfo, dlgMain.pnlFileType.pnlOptions.grpPNG24Options.png24Inter.value, dlgMain.pnlFileType.pnlOptions.grpPNG24Options.png24Trans.value);
			//var saveFile = new File(exportInfo.destination + '/' + fileNameBody + '.png');
			break;

		default:
			if (DialogModes.NO != app.playbackDisplayDialogs) {
				alert(strUnexpectedError);
			}
			break;
	}

	function savePng24(fileNameBody, exportInfo, interlacedValue, transparencyValue) { //保存png24
		// alert(exportInfo.destination + '/'+ exportInfo.imgDir + "/" + fileNameBody + ".png");
		var id6 = charIDToTypeID("Expr");
		var desc3 = new ActionDescriptor();
		var id7 = charIDToTypeID("Usng");
		var desc4 = new ActionDescriptor();
		var id8 = charIDToTypeID("Op  ");
		var id9 = charIDToTypeID("SWOp");
		var id10 = charIDToTypeID("OpSa");
		desc4.putEnumerated(id8, id9, id10);
		var id11 = charIDToTypeID("Fmt ");
		var id12 = charIDToTypeID("IRFm");
		var id13 = charIDToTypeID("PN24");
		desc4.putEnumerated(id11, id12, id13);
		var id14 = charIDToTypeID("Intr");
		desc4.putBoolean(id14, interlacedValue);
		var id15 = charIDToTypeID("Trns");
		desc4.putBoolean(id15, transparencyValue);
		var id16 = charIDToTypeID("Mtt ");
		desc4.putBoolean(id16, true);
		var id17 = charIDToTypeID("MttR");
		desc4.putInteger(id17, 255);
		var id18 = charIDToTypeID("MttG");
		desc4.putInteger(id18, 255);
		var id19 = charIDToTypeID("MttB");
		desc4.putInteger(id19, 255);
		var id20 = charIDToTypeID("SHTM");
		desc4.putBoolean(id20, false);
		var id21 = charIDToTypeID("SImg");
		desc4.putBoolean(id21, true);
		var id22 = charIDToTypeID("SSSO");
		desc4.putBoolean(id22, false);
		var id23 = charIDToTypeID("SSLt");
		var list1 = new ActionList();
		desc4.putList(id23, list1);
		var id24 = charIDToTypeID("DIDr");
		desc4.putBoolean(id24, false);
		var id25 = charIDToTypeID("In  ");
		desc4.putPath(id25, new File(exportInfo.destination + '/'+ exportHeader.imgDir + "/" + fileNameBody + ".png"));
		var id26 = stringIDToTypeID("SaveForWeb");
		desc3.putObject(id7, id26, desc4);
		executeAction(id6, desc3, DialogModes.NO);
	}

	function savePng8(fileNameBody, exportInfo, interlacedValue, transparencyValue) { //保存png8
		var id5 = charIDToTypeID("Expr");
		var desc3 = new ActionDescriptor();
		var id6 = charIDToTypeID("Usng");
		var desc4 = new ActionDescriptor();
		var id7 = charIDToTypeID("Op  ");
		var id8 = charIDToTypeID("SWOp");
		var id9 = charIDToTypeID("OpSa");
		desc4.putEnumerated(id7, id8, id9);
		var id10 = charIDToTypeID("Fmt ");
		var id11 = charIDToTypeID("IRFm");
		var id12 = charIDToTypeID("PNG8");
		desc4.putEnumerated(id10, id11, id12);
		var id13 = charIDToTypeID("Intr"); //Interlaced
		desc4.putBoolean(id13, interlacedValue);
		var id14 = charIDToTypeID("RedA");
		var id15 = charIDToTypeID("IRRd");
		var id16 = charIDToTypeID("Prcp"); //Algorithm
		desc4.putEnumerated(id14, id15, id16);
		var id17 = charIDToTypeID("RChT");
		desc4.putBoolean(id17, false);
		var id18 = charIDToTypeID("RChV");
		desc4.putBoolean(id18, false);
		var id19 = charIDToTypeID("AuRd");
		desc4.putBoolean(id19, false);
		var id20 = charIDToTypeID("NCol"); //NO. Of Colors
		desc4.putInteger(id20, 256);
		var id21 = charIDToTypeID("Dthr"); //Dither
		var id22 = charIDToTypeID("IRDt");
		var id23 = charIDToTypeID("Dfsn"); //Dither type
		desc4.putEnumerated(id21, id22, id23);
		var id24 = charIDToTypeID("DthA");
		desc4.putInteger(id24, 100);
		var id25 = charIDToTypeID("DChS");
		desc4.putInteger(id25, 0);
		var id26 = charIDToTypeID("DCUI");
		desc4.putInteger(id26, 0);
		var id27 = charIDToTypeID("DChT");
		desc4.putBoolean(id27, false);
		var id28 = charIDToTypeID("DChV");
		desc4.putBoolean(id28, false);
		var id29 = charIDToTypeID("WebS");
		desc4.putInteger(id29, 0);
		var id30 = charIDToTypeID("TDth"); //transparency dither
		var id31 = charIDToTypeID("IRDt");
		var id32 = charIDToTypeID("None");
		desc4.putEnumerated(id30, id31, id32);
		var id33 = charIDToTypeID("TDtA");
		desc4.putInteger(id33, 100);
		var id34 = charIDToTypeID("Trns"); //Transparency
		desc4.putBoolean(id34, transparencyValue);
		var id35 = charIDToTypeID("Mtt ");
		desc4.putBoolean(id35, true); //matte
		var id36 = charIDToTypeID("MttR"); //matte color
		desc4.putInteger(id36, 255);
		var id37 = charIDToTypeID("MttG");
		desc4.putInteger(id37, 255);
		var id38 = charIDToTypeID("MttB");
		desc4.putInteger(id38, 255);
		var id39 = charIDToTypeID("SHTM");
		desc4.putBoolean(id39, false);
		var id40 = charIDToTypeID("SImg");
		desc4.putBoolean(id40, true);
		var id41 = charIDToTypeID("SSSO");
		desc4.putBoolean(id41, false);
		var id42 = charIDToTypeID("SSLt");
		var list1 = new ActionList();
		desc4.putList(id42, list1);
		var id43 = charIDToTypeID("DIDr");
		desc4.putBoolean(id43, false);
		var id44 = charIDToTypeID("In  ");
		desc4.putPath(id44, new File(exportInfo.destination + '/'+ exportHeader.imgDir + "/" + fileNameBody + ".png"));
		var id45 = stringIDToTypeID("SaveForWeb");
		desc3.putObject(id6, id45, desc4);
		executeAction(id5, desc3, DialogModes.NO);
	}
}

/**
 * Function: setInvisibleAllArtLayers
 *   Usage: unlock and make invisible all art layers
 *   Input: document
 *   Return: all art layers are unlocked and invisible
 */
function setInvisibleAllArtLayers(obj) { //设置不可见所有图层

	var artLen = obj.artLayers.length,
		idx = 0;

	for (idx; idx < artLen; idx += 1) {
		obj.artLayers[idx].allLocked = false;
		obj.artLayers[idx].visible = false;
	}
}

/**
 * Function: removeInvisibleArtLayers
 *   Usage: remove all invisible art layers
 *   Input: document
 *   Return: <none>, all layers that were invisible are now gone
 *     funky index manipulation to handle the array length changes
 *     without hitting the catch block
 */
function removeInvisibleArtLayers(doc) { //移除不可见图层

	var len = doc.artLayers.length,
		idx = len - 1,
		removed = false;

	while (len) {
		removed = false;
		try {
			if (!doc.artLayers[idx].visible) {
				doc.artLayers[idx].remove();
				removed = true;
			}
		} catch (e) {}
		if (removed) {
			len = doc.artLayers.length;
			idx = len - 1;
		} else {
			idx -= 1;
		}
		if (idx < 0) {
			return;
		}
	}
}

/**
 * Function: ungroupLayerSet
 *   Usage: ungroup a layerSet
 *   Input: <none>
 *   Return: <none> layerSet has been ungrouped
 */
function ungroupLayerSet() { //拆散图层组

	var desc = new ActionDescriptor(),
		ref = new ActionReference();

	ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
	desc.putReference(charIDToTypeID("null"), ref);
	try {

		executeAction(stringIDToTypeID("ungroupLayersEvent"), desc, DialogModes.NO);

	} catch (e) {}
}

/**
 * Function: ungroupAllLayerSets
 *   Usage: ungroup all layerSets
 *   Input: duplicate document
 *   Return: <none>, layerSets have been ungrouped
 */
function ungroupAllLayerSets(wrkDoc) { //拆散所有图层组

	var setLen = wrkDoc.layerSets.length,
		idx = setLen - 1;

	while (setLen) {

		wrkDoc.activeLayer = wrkDoc.layerSets[idx];
		ungroupLayerSet();
		setLen = wrkDoc.layerSets.length;
		idx = setLen - 1;
	}
}

/**
 * Function: catLeftZeros
 *   Usage: return a string padded to fixed length
 *   Input: number to convert, length
 *   Return: string padded to length
 */
function catLeftZeros(num, len) { //返回固定长度的字符串

	var str = num.toString();

	if (str.length < len) {
		while (str.length < len) {
			str = '0' + str;
		}
	}
	return str;
}

/**
 * Function: exportChildren
 *   Usage: find all the children in this document to save
 *   Input: duplicate document, original document, export info,
 *        reference to document, starting file name, exported images array
 *   Return: <none>, documents are saved accordingly
 */
function exportChildren(dupDoc, exportInfo) { //导出所以文档中的子元素

	var artLen = dupDoc.artLayers.length,
		artIdx = 0,
		fileNameBody,
		idxStr = '',
		isJpg = false,
		isPng = false,
		layerName,
		places = artLen.toString().length,
		pngTrim = false,
		wrkDoc,
		xpHeight = 0,
		xpLeft = 0,
		xpTop = 0,
		xpWidth = 0;

	if (exportHeader.extension === '.jpg') {

		isJpg = true;

	} else {

		isPng = true;

		if (png24Index == exportInfo.fileType) {

			pngTrim = dlgMain.pnlFileType.pnlOptions.grpPNG24Options.png24Trm.value;

		} else {

			pngTrim = dlgMain.pnlFileType.pnlOptions.grpPNG8Options.png8Trm.value;
		}
	}

	for (artIdx; artIdx < artLen; artIdx += 1) {

		dupDoc.artLayers[artIdx].visible = true;
		//判断layername是否含中文
		layerName = dupDoc.artLayers[artIdx].name;

		if (/[\u4E00-\u9FA5\uF900-\uFA2D]/.test(layerName)) {
			layerName = 'img_' + (++layerindex);
		}
		wrkDoc = dupDoc.duplicate();

		if (isJpg) {

			wrkDoc.flatten();

		} else {

			removeInvisibleArtLayers(wrkDoc);

			if (pngTrim) {

				if (wrkDoc.activeLayer.isBackgroundLayer == false) { //is it anything but a background layer?

					wrkDoc.trim(TrimType.TRANSPARENT);
				}
			}
		}

		xpLeft = dupDoc.artLayers[artIdx].bounds[0].value;
		if (xpLeft < 0) {
			xpLeft = 0;
		}

		xpTop = dupDoc.artLayers[artIdx].bounds[1].value;
		if (xpTop < 0) {
			xpTop = 0;
		}

		xpWidth = app.activeDocument.width.value;

		xpHeight = app.activeDocument.height.value;

		idxStr = catLeftZeros(imgIdx, places);

		fileNameBody = exportInfo.fileNamePrefix + '_' + layerName; //设置导出的图片名称

		if (fileNameBody.length > 120) {
			fileNameBody = fileNameBody.substring(0, 120);
		}
		saveFile(wrkDoc, fileNameBody, exportInfo);

		wrkDoc.close(SaveOptions.DONOTSAVECHANGES);

		dupDoc.artLayers[artIdx].visible = false;

		exportImageData[imgIdx] = {
			name: fileNameBody,
			left: xpLeft,
			top: xpTop,
			width: xpWidth,
			height: xpHeight
		};
		imgIdx += 1;
	}
}

/**
 * Function: setExportHeader
 *   Usage: captures info about the exported images, later used to create css, html and JSON.
 *   Input: the .psd we're exporting from, and an object containing user output prefs
 *   Return: none, sets values in global object exportHeader
 */
function setExportHeader(psd, exportInfo) { //设置导出头

	exportHeader.psdName = psd.name;
	exportHeader.psdWidth = psd.width.value;
	exportHeader.psdHeight = psd.height.value;
	exportHeader.prefix = exportInfo.fileNamePrefix;
	exportHeader.outDir = exportInfo.destination;

	if (exportInfo.fileType === jpegIndex) {
		exportHeader.extension = '.jpg';
	} else {
		exportHeader.extension = '.png';
	}
}

//移除图片名中的短横线
function removeHyphen(name) {
	return name.replace(/-/g, '');
}
/**
 * Function: writeHtml
 *   Usage: writes an html file with images in divs
 *   Input: object containing general info, array containing images info
 *   Return: <none>, file has been written
 */
function writeHtml() { //写html

	var htmlOut,
		images = exportImageData,
		idx = images.length - 1,
		hdr = exportHeader;

	htmlOut = new File(hdr.outDir + '/' + hdr.prefix + '.html');
	htmlOut.open('w');
	htmlOut.writeln('<!doctype html>');
	htmlOut.writeln('<html>');
	htmlOut.writeln('<head>');
	htmlOut.writeln('    <meta charset="utf-8">');
	htmlOut.writeln('    <title>' + hdr.psdName + ' export</title>');
	htmlOut.writeln('    <link rel="stylesheet" href="' + hdr.cssDir + '/'+ hdr.prefix + '.css' + '">');
	htmlOut.writeln('</head>');
	htmlOut.writeln('<body>');
	htmlOut.writeln('<div class="slider-item  ' + hdr.prefix + '">');

	// Photoshop extracts top first; we'll put em on the page bottom first
	for (idx; idx >= 0; idx -= 1) {

		htmlOut.writeln('    <div class="' + removeHyphen(images[idx].name) + '">');
		htmlOut.writeln('          <img src="' + hdr.imgDir + '/' + images[idx].name + hdr.extension + '" alt="" id="' + images[idx].name + '">');
		htmlOut.writeln('    </div>');
	}
	//src:"imgs/'+images[idx].name+hdr.extension

	htmlOut.writeln('</div>');
	htmlOut.writeln('</body>');
	htmlOut.writeln('</html>');
	htmlOut.close();
}

/**
 * Function: writeCss
 *   Usage: writes a css file with images div ids positioned absolutely
 *   Input: exportImages array containing exported images info
 *   Return: <none>, file has been written
 */
function writeCss() { //写css

	var cssOut,
		images = exportImageData,
		idx = images.length - 1,
		hdr = exportHeader;

	cssOut = new File(hdr.outDir + '/' + hdr.cssDir + '/' + hdr.prefix + '.css');
	cssOut.open('w');
	cssOut.writeln('/* exported css for ' + hdr.psdName + ' */');
	cssOut.writeln('\n');
	cssOut.writeln('body,html { width:100%;height:100%; }');
	cssOut.writeln('div>img { width:100%;height:100%; }');
	cssOut.writeln('\n');
	cssOut.writeln('body { margin: 0px; padding:0px; background: hsl(229, 47%, 9%); }');
	cssOut.writeln('\n');
	cssOut.writeln('.slider-item {');
	cssOut.writeln('    position: absolute;');
	cssOut.writeln('    left: 0px;');
	cssOut.writeln('    top: 0px;');
	cssOut.writeln('    width: 100%;');
	cssOut.writeln('    height: 100%;');
	cssOut.writeln('    background: #000;');
	cssOut.writeln('}');

	// Photoshop extracts top first; put em in the css bottom first
	for (idx; idx >= 0; idx -= 1) {

		cssOut.writeln('\n');
		cssOut.writeln('.' + removeHyphen(images[idx].name) + ' {');
		cssOut.writeln('    position: absolute;');
		cssOut.writeln('    top:    ' + parseFloat(parseInt((images[idx].top * 100 / hdr.psdHeight)*100)/100) + '%;');
		cssOut.writeln('    left:   ' + parseFloat(parseInt((images[idx].left * 100 / hdr.psdWidth)*100)/100) + '%;');
		cssOut.writeln('    height: ' + parseFloat(parseInt((images[idx].height * 100 / hdr.psdHeight)*100)/100) + '%;');
		cssOut.writeln('    width:  ' + parseFloat(parseInt((images[idx].width * 100 / hdr.psdWidth)*100)/100) + '%;');
		cssOut.writeln('}');
	}
	cssOut.close();
}

/**
 * Function: writeJson
 *   Usage: writes a javascript file with image info as JSON;
 *   javascript file is a single function which returns stringified JSON.
 *   Input: exportImages array containing exported images info
 *   Return: <none>, file has been written
 */
function writeJson() { //写json

	var crock,
		images = exportImageData,
		idx = images.length - 1,
		jsOut,
		hdr = exportHeader;

	jsOut = new File(hdr.outDir + '/' + hdr.prefix + '.js');
	jsOut.open('w');
	jsOut.writeln('/* exported json for ' + hdr.psdName + ' */');
	jsOut.writeln('\n');
	jsOut.writeln('var imgInput = function () {');
	jsOut.writeln('\n');
	jsOut.writeln('  var input = {');
	jsOut.writeln('    "container" : {');
	jsOut.writeln('      "width"    : ' + hdr.psdWidth + ',');
	jsOut.writeln('      "height"   : ' + hdr.psdHeight);
	jsOut.writeln('     },');

	jsOut.writeln('    "images" : [');

	// Photoshop extracts top first; put em in the JSON bottom first
	for (idx; idx >= 0; idx -= 1) {

		jsOut.writeln('      {');
		jsOut.writeln('         "name"     : "' + images[idx].name + '",');
		jsOut.writeln('         "extension": "' + hdr.extension + '",');
		jsOut.writeln('         "left"     : ' + images[idx].left + ',');
		jsOut.writeln('         "top"      : ' + images[idx].top + ',');
		jsOut.writeln('         "width"    : ' + images[idx].width + ',');
		jsOut.writeln('         "height"   : ' + images[idx].height);

		crock = idx > 0 ? jsOut.writeln('      },') : jsOut.writeln('      }');
	}
	jsOut.writeln('    ]');
	jsOut.writeln('  };');
	jsOut.writeln('\n');
	jsOut.writeln('  return JSON.stringify(input);');
	jsOut.writeln('}');

	jsOut.close();
}
//导出Manifest
function writeManifest() {
	var manifestOut,
		images = exportImageData,
		idx = images.length - 1,
		hdr = exportHeader;

	manifestOut = new File(hdr.outDir + '/' + hdr.prefix + '.manifest');
	manifestOut.open('w');
	manifestOut.writeln('/* exported manifest for ' + hdr.psdName + ' */');
	manifestOut.writeln('\n');


	// Photoshop extracts top first; put em in the css bottom first
	for (idx; idx >= 0; idx -= 1) {


		manifestOut.writeln('{src:"'+ hdr.imgDir + '/' + images[idx].name + hdr.extension + '",id:"' + images[idx].name + '",type:"image"},');

	}
	manifestOut.close();
}

/**
 * Function: writeTxtFiles
 *   Usage: if export was successful, writes text files from image data
 *   Input: exportImages array containing exported images info
 *   Return: <none>, text files have been written
 */
function writeTxtFiles() { //调用前面的写方法

	// could've written these as one function,
	// left em separate for easy customization,
	// e.g., could've written writeCsv()





	writeHtml();
	writeCss();
	// writeJson();
	writeManifest();


}

/**
 * Function: main
 *   Usage: the core routine for this script
 *   Input: <none>
 *   Return: <none>
 */
function main() { //入口函数
	new Folder(exportHeader.imgDir).create();
	new Folder(exportHeader.cssDir).create();
	

	var docName = '',
		dupDoc,
		exportInfo = {},
		layerCount = 0,
		layerSetsCount = 0;

	if (app.documents.length <= 0) {
		if (DialogModes.NO != app.playbackDisplayDialogs) {
			alert(strAlertDocumentMustBeOpened);
		}
		return 'cancel'; // quit, returning 'cancel' (dont localize) makes the actions palette not record our script
	}

	initExportInfo(exportInfo);

	// kpedt this was where descriptorToObject calls were in 'Export layers to files.jsx'

	if (DialogModes.ALL == app.playbackDisplayDialogs) {
		if (cancelButtonID == settingDialog(exportInfo)) {
			return 'cancel'; // quit, returning 'cancel' (dont localize) makes the actions palette not record our script
		}
	}

	try {

		docName = app.activeDocument.name; // save the app.activeDocument name before duplicate.

		layerCount = app.documents[docName].layers.length;
		layerSetsCount = app.documents[docName].layerSets.length;

		if ((layerCount <= 1) && (layerSetsCount <= 0)) {

			if (DialogModes.NO != app.playbackDisplayDialogs) {
				alert(strAlertNeedMultipleLayers);
				return 'cancel'; // quit, returning 'cancel' (dont localize) makes the actions palette not record our script
			}
		} else {

			app.activeDocument = app.documents[docName];

			setExportHeader(app.activeDocument, exportInfo);

			dupDoc = app.activeDocument.duplicate();

			ungroupAllLayerSets(dupDoc);

			removeInvisibleArtLayers(dupDoc);

			dupDoc.activeLayer = dupDoc.layers[dupDoc.layers.length - 1];

			setInvisibleAllArtLayers(dupDoc);
			exportChildren(dupDoc, exportInfo);
			dupDoc.close(SaveOptions.DONOTSAVECHANGES);

			if (DialogModes.ALL == app.playbackDisplayDialogs) {

				writeTxtFiles();
				app.preferences.rulerUnits = originalUnit;

				alert(strTitle + strAlertWasSuccessful);
			}

			app.playbackDisplayDialogs = DialogModes.ALL;
		}

	} catch (e1) {
		if (DialogModes.NO != app.playbackDisplayDialogs) {
			alert(e1);
		}

		app.preferences.rulerUnits = originalUnit;

		return 'cancel'; // quit, returning 'cancel' (dont localize) makes the actions palette not record our script
	}
}