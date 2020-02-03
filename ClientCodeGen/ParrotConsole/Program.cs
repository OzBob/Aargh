using System;

namespace ParrotConsole
{
    class Program
    {
        static async System.Threading.Tasks.Task Main(string[] args)
        {
            Console.WriteLine("Hello World of Values!");
            Console.WriteLine("Press any key to continue...");
            var key = Console.ReadKey();

            var client = (new ParrotAPIClient.ParrotFactory()).Generate();
            client.BaseUri = new Uri("https://localhost:44346");
            var response = await client.Values.GetWithHttpMessagesAsync();
            foreach (var responseValue in response.Body)
            {
                Console.WriteLine($"responseValue:{responseValue}");
            }
        }
    }
}
