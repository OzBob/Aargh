using Microsoft.Rest;
using System;
using System.Collections.Generic;
using System.Text;
using Values;

namespace ParrotAPIClient
{
    public class ParrotFactory
    {
        public ParrotFactory()
        {
        }
        public IParrotAPI Generate()
        {
            //ServiceClientCredentials _credentials;
            return new ParrotAPI(new System.Net.Http.HttpClient(), true);
        }
    }
}
