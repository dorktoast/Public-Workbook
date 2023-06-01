// Downtime Automation Manager (code.gs)
// 
// Made for Dark Skylines LARP
// Sam Swicegood (6/1/2023)
// 
// License data can be found at the bottom of this script.

// ===== Initialization =====
var ss = SpreadsheetApp.getActive();
var ui = SpreadsheetApp.getUi();

const NARRATOR_EMAILS = [
    'sam@gib.games'
	// other target emails here
  ];

const FORM_ID = 'Google_Form_ID_Here';
const DRIVE_FOLDER_ID = 'Drive_Folder_ID_Here';

// Different IDs and URLs for Narrators and OOC
const ROLE_IDS = {
  'Narrators': '<@&Narrator_Role_Id>: ',
  'OOC': '<@&OOC_Role_ID>: '
};

const DISCORD_WEBHOOKS = {
  'Narrators': 'https://discord.com/api/webhooks/Narrator_Channel_Webhook',
  'OOC': 'https://discord.com/api/webhooks/OOC_Channel_Webhook'
};

function onOpen() {
  SpreadsheetApp.getUi() //initialize UI
      .createMenu('Dark Skylines')
      .addItem('Generate Report', 'GenerateReport')
      .addItem('Squawk to Discord', 'SquawkToDiscord')
      .addItem('Open Downtimes', 'OpenDowntimes')
      .addItem('Close Downtimes', 'CloseDowntimes')
      .addToUi();
}

// ===== Public functions =====

function GenerateReport()
{
  var response = ui.alert('Downtime report will be generated. Do you wish to alert narrators?', ui.ButtonSet.YES_NO);

  if (response == ui.Button.YES) {
    doGenerateReport();
  }
  else if(response == ui.Button.YES) {
    doGenerateReport(false);
  }
}

function OpenDowntimes() {
  var downtimeForm = FormApp.openById(FORM_ID);
  
    if(downtimeForm.isAcceptingResponses) { //Sanity Check
      ui.alert('Downtimes are already open.');
      return;
    }

  var response = ui.prompt('Open Downtimes', 'Set the downtime close date and press OK.', ui.ButtonSet.OK_CANCEL);
  var closeDate = response.getResponseText();

  // Open Downtimes
  if (response.getSelectedButton() == ui.Button.OK) {
    var newDescription = "Downtimes are now open! Downtimes will close " + closeDate + " at 1 pm Eastern.";
    downtimeForm.setAcceptingResponses(true);
    // downtimeForm.deleteAllResponses();
    downtimeForm.setDescription(newDescription);

    // Alert the masses
    var formUrl = downtimeForm.getPublishedUrl();
    var discordAlert = newDescription + " You can file downtimes here: " + downtimeForm.shortenFormUrl(formUrl);
    postDiscordMessage(discordAlert,true,'OOC');
  }
}

function CloseDowntimes() {
  var downtimeForm = FormApp.openById(FORM_ID);
  
    if(!downtimeForm.isAcceptingResponses) { //Sanity Check
      ui.alert('Downtimes are already closed.');
      //return;
    }

  var response = ui.prompt('Close Downtimes', 'Set the downtime open date and press OK.', ui.ButtonSet.OK_CANCEL);
  var openDate = response.getResponseText();

  // Close Downtimes
  if (response.getSelectedButton() == ui.Button.OK) {
    var closedMsg = "Downtimes are now closed! Downtimes will reopen after the next game session.";
    downtimeForm.setAcceptingResponses(false);
    downtimeForm.setCustomClosedFormMessage(closedMsg);
    GenerateReport();

    // Alert the Masses
    postDiscordMessage(closedMsg,true,'OOC');
    postDiscordMessage("Downtimes have been closed.",false,'Narrators');
  }
}

function SquawkToDiscord() {
  var response = ui.prompt('Squawk to OOC', 'Enter announcement. Would you like to ping users?', ui.ButtonSet.YES_NO_CANCEL);

  var targetMessageText = response.getResponseText();

  // Process the user's response.
  if (response.getSelectedButton() == ui.Button.YES) {
    postDiscordMessage(targetMessageText, true,'OOC');
  } else if (response.getSelectedButton() == ui.Button.NO) {
    postDiscordMessage(targetMessageText, false,'OOC');
  } else {
    Logger.log('The user canceled.');
  }
}

// ===== Private functions =====

function groupBy(array, column) {
  return array.reduce(function(result, item) {
    (result[item[column]] = result[item[column]] || []).push(item);
    return result;
  }, {});
}

function doGenerateReport(doAlert = true) {

  var sh = ss.getSheetByName('Action Dashboard');
  var rows = sh.getDataRange().getValues();

  var todayDate = Utilities.formatDate(new Date(), "America/New_York", "MM/dd/yyyy");

  var docTitle = "Downtime Responses Report: " + todayDate;
  var doc = DocumentApp.create(docTitle);

  var destination = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  var docID = doc.getId();
  var file = DriveApp.getFileById(docID);
  file.moveTo(destination);

  var body = doc.getBody();

  // Third column is the Downtime category, used for grouping
  var groupedRows = groupBy(rows.slice(1), 2); // Remove header

  for (var key in groupedRows) {
    if (groupedRows.hasOwnProperty(key)) {
      // Append a header style
      body.appendParagraph(key).setHeading(DocumentApp.ParagraphHeading.HEADING1);

      groupedRows[key].forEach(function(row) {
        var item1 = row[1] + ": ";
        var item2 = row[3] + " (" + row[4] + ")";
        var paragraph = body.appendParagraph(item1 + item2);
        var elementText = paragraph.editAsText();
        elementText.setBold(0, item1.length - 2, true); // Set style and formatting
		
        body.appendParagraph("\n"); // Append a new line after each element
      });
    }
  }
  
  // Print out debug text at the bottom of the document
  var timestampNow = Utilities.formatDate(new Date(), 'America/New_York', 'MMMM dd, yyyy HH:mm:ss Z')
  var generatedString = "\n\n# Generation Script Data\nDark Skylines Downtime Responses\nGenerated "+timestampNow+"\nGoogle Doc ID: "+docID;
  var generationInfo = body.appendParagraph(generatedString);
  var genText = generationInfo.editAsText();
  genText.setFontFamily('Roboto Mono');
  genText.setFontSize(8);
  genText.setForegroundColor("#BBBBBB");

  // Send alert to Narrators and add them as document editors
  var narratorAlertMsg = "The downtime report for " + todayDate + " was generated at " + timestampNow + " and is available for review here: " + doc.getUrl();
  postDiscordMessage(narratorAlertMsg,doAlert,'Narrators');

  if(doAlert) {
    doc.addEditors(NARRATOR_EMAILS);
  }

  // Save changes
  doc.saveAndClose();
}

function postDiscordMessage(message, doPing, type) {
  if(doPing) {
    message = ROLE_IDS[type] + message;
  }
  else {
    message = message || "This is a test.";
  }

  var discordUrl = DISCORD_WEBHOOKS[type];
  var payload = JSON.stringify({content: message});

  var params = {
    headers: {
      'Content-Type': 'application/json'
    },
    method: "POST",
    payload: payload,
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(discordUrl, params);

  Logger.log(response.getContentText());
}

/* 
==========================
Copyright 2023 GIB Games, licensed under MIT

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 
==========================
*/