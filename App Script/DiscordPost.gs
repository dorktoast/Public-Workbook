// Send a Discord message via Apps Script

function PostDiscordMessage(message) {
  // Target Data
  var discordUrl = 'https://discord.com/api/webhooks/YOUR_WEBHOOK_URL';
  
  // replace pings with appropriate IDs
  message = message.ToString().replace("@SomeRole","<@&123456789123456789>"); // your channel id here

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
