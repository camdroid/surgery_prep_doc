// APA Surgery Prep - Doc

const util = apalibrary;
const today = util.today;

function insertDataIntoTemplate(template, data) {
  Object.keys(data).forEach(field => {
    template.replaceText(Utilities.formatString("{{%s}}", field), data[field]);
  });
}

function initEndDocument(docId) {
  var baseDoc = DocumentApp.openById(baseDocId);
  baseDoc.getBody().clear();
  const margin = 30;
  var body = baseDoc.getActiveSection();
  body = util.setBodyMargin(body, 30);
  return body;
}

function createEndDocument(folder_id): Body {
  docName = Utilities.formatString("APA Surgery Note %s", today());
  baseDocId = DocumentApp.create(docName).getId();
  DriveApp.getFileById(baseDocId).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.NONE);

  util.moveFileToFolder(baseDocId, folder_id);
  return baseDocId;
}

function mergeFilesInFolder(folder_id: number) {
  util.log("Merging files");
  folder = DriveApp.getFolderById(folder_id);
  files = folder.getFiles();
  docIDs = [];

  while (files.hasNext()){
    file = files.next();
    docIDs.push(file.getId());
  }

  //Shamelessly copied from
  // https://stackoverflow.com/questions/29032656/google-app-script-merge-multiple-documents-remove-all-line-breaks-and-sent-as
  // Create new aggregated doc

  // clear the whole document and start with empty page
  var finalDocId = createEndDocument(folder_id);
  var body = initEndDocument(finalDocId);

  const bodyHelper = new BodyHelper(body);

  docIDs.forEach(docID => {
    var otherBody = DocumentApp.openById(docID).getActiveSection().copy();
    for( var j = 0; j < otherBody.getNumChildren(); ++j ) {
      var element = otherBody.getChild(j).copy();
      bodyHelper.append(element);
    }
    body.appendPageBreak();
  }
  return finalDocId;
}

function generateSurgeryDoc() {
  SPREADSHEET_DATA_ID = "1PYatshebqAXaRoiEfJqvj_0jIyWADJq7YxrrBfn1XzE";
  TEMPLATE_DOC_ID = "11tKJlCMqgxm7yzJD8SvbmsQjOI8X2DHx2INjtAfU7uk";
  OUTPUT_FOLDER_ID = '15bnax8_qG8rjOV5uHqb8pGSl5u4lTp0s';

  allAnimalData = Sheets.Spreadsheets.Values.get(SPREADSHEET_DATA_ID, "A2:T");
  spreadsheetHeaders = Sheets.Spreadsheets.Values.get(SPREADSHEET_DATA_ID, "A1:1").values[0];

  outputFolder = DriveApp.getFolderById(OUTPUT_FOLDER_ID);

  for(var i=0; i<allAnimalData.values.length; i++) {
    structuredData = util.parseSpreadsheetData(allAnimalData.values[i], spreadsheetHeaders);

    templateID = DriveApp.getFileById(TEMPLATE_DOC_ID).makeCopy('output'+i, outputFolder).getId();
    templateBody = DocumentApp.openById(templateID).getBody();
    insertDataIntoTemplate(templateBody, structuredData);
    templateBody.replaceText("{{Date}}", today());
  }
  var finalDocId = mergeFilesInFolder(OUTPUT_FOLDER_ID);
  showUserLinkToDocument(finalDocId);
}

function showUserLinkToDocument(docId) {
  docUrl = 'https://docs.google.com/document/d/' + docId + '/edit';
  html = HtmlService.createHtmlOutput('<a href="' + docUrl + '" target="_blank">Open Surgery Prep Doc Here</a>')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  DocumentApp.getUi().showModalDialog(html, 'Document Ready');
}

function onOpen(e) {
  var menu = DocumentApp.getUi().createMenu('Surgery Prep');
  menu.addItem('Generate Surgery Docs', 'generateSurgeryDoc');
  menu.addToUi();
}
