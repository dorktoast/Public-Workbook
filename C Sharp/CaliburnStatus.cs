namespace LarpBot.Commands
{
    public class LarpCommands : ApplicationCommandModule
    {
    // ...
    
        [SlashCommand("Caliburn", "Get info about Caliburn Island's current status.")]
        public async Task GetCaliburn(InteractionContext ctx)
        {
            // ===== Weather =====

            string apiKey = "XXXXXXXXXXXXXXXXXXXX"; // OpenWeather APi key
            
            // Latitude/Longitude of Caliburn Island
            double lat = 42.3831;
            double lon = -70.8123;

            // Making the API call
            string weatherEndpoint = $"https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&exclude=minutely,hourly,daily,alerts&appid={apiKey}";

            using HttpClient client = new HttpClient();
            HttpResponseMessage response = await client.GetAsync(weatherEndpoint);
            response.EnsureSuccessStatusCode();

            string responseBody = await response.Content.ReadAsStringAsync();
            JObject weatherData = JObject.Parse(responseBody);

            string weatherDescription = weatherData["current"]["weather"][0]["description"].ToString();

            // it is always 7°F (3.89°C) colder in Caliburn than in real-world Boston.
            double temperatureKelvin = weatherData["current"]["temp"].Value<double>();
            double temperatureCelsius = (temperatureKelvin - 273.15) - 3.89;
            double temperatureFahrenheit = ((temperatureKelvin - 273.15) * 9 / 5 + 32) - 7; 

            string weatherIcon = weatherData["current"]["weather"][0]["icon"].ToString();

            // ===== Time =====
            DateTime easternTime = DateTime.Now;

            // Adjust it to 2051
            int currentYear = easternTime.Year;
            int yearsToAdd = 2051 - currentYear;
            DateTime futureEasternTime = easternTime.AddYears(yearsToAdd);

            // Format the date and time
            string formattedDate = futureEasternTime.ToString("dddd, MMMM d, yyyy h:mm tt");

            string callout = $"**__Caliburn Island, MA__**\nIt is currently **{formattedDate}** (Eastern).\n" +
                $"The weather for Caliburn Island is {temperatureFahrenheit:0.##}°F ({temperatureCelsius:0.##}°C) with {weatherDescription}.";

            string iconCallout = weatherIcon != "" ? $"https://openweathermap.org/img/wn/{weatherIcon}.png" : "";

            // Respond
            await ctx.Channel.SendMessageAsync(iconCallout);

            await ctx.CreateResponseAsync(InteractionResponseType.ChannelMessageWithSource,
                new DiscordInteractionResponseBuilder().WithContent(callout));
             
            // ...
        }
