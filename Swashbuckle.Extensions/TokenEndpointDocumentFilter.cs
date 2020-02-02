using Swashbuckle.Swagger;
using System.Collections.Generic;
using System.Web.Http.Description;

namespace Swashbuckle.Extensions
{
    public class TokenEndpointDocumentFilter : IDocumentFilter
    {
        public void Apply(SwaggerDocument swaggerDoc, SchemaRegistry schemaRegistry, IApiExplorer apiExplorer)
        {
            var prop = new KeyValuePair<string, Schema>(
                "OAuth2TokenPostResponse", new Schema
                {
                    type = "object",
                    properties = new Dictionary<string, Schema>
                    {
/*
{
"access_token": "Le4Ye1AeArPfWCzeEaw682kEQDyzPqluUCcaUswDWGJ3t3pmwTss4RemmPALMuTy4eBuHyjT996OG6mX1RpxM4VPasWoozBuly1wlDDXwA6qrQbLVgaTfD-cD3uyfECYUGiHKUPXZdqN2ybxJWp26bUHZ-Bl9tDiw4b1KxNxTmesaD4aaOBE8ApZlRRfyPcMKF72BF-ute-OdSgqJWss6PlggMG2vCV9yClQ29iPnQDfLa5cSfe3NRjPjEtzvDRqU3ptjKjv624slDPaJ-77V-mNxKrFO-D6iFF0rNTJOXE87hrsfMUw22eokhRp_PK385xKP2Y87n-Xjsb7szzeGzeFQyTB0jFSoS_uB-BwjXnuBSzNH5JYJdSNMODcFkoYY4CqTTu-UjO3NW3xynb8dytX8f7gqtVzq9tZxNuyiu8fnjYLRZRWysOmdAVQbR-hciC-d70jE_-6HPqHyjcx0kO9_l-1vtpKXXp9XqufYodBLOqKXR3KnMaHZVj5cmewJZWBTzWJWpkquO2D4LbyXw",
"token_type": "bearer",
"expires_in": 1209599,
"userName": "apitestuser@exalt.com.au",
".issued": "Mon, 11 Mar 2019 08:47:03 GMT",
".expires": "Mon, 25 Mar 2019 08:47:03 GMT"
}
*/
                        {
                            "access_token",
                            new Schema {type = "string"}
                        },
                        {
                            "token_type",
                            new Schema      {type = "string" }
                        },
                        {
                            "expires_in",
                            new Schema      {type = "integer"}
                        },
                        {
                            "userName",
                            new Schema      {type = "string" }
                        },
                        {
                            ".issued",
                            new Schema      {type = "string" }
                        },
                        {
                            ".expires",
                            new Schema      {type = "string" }
                        }
                    }
                });

            swaggerDoc.definitions.Add(prop);

            swaggerDoc.paths.Add("/Token", new PathItem
            {
                post = new Operation
                {
                    tags = new string[] { "Authentication" },
                    summary = "Authenticates provided credentials and returns an access token",
                    operationId = "OAuth2TokenPost",
                    consumes = new string[] { "application/x-www-form-urlencoded" },
                    produces = new string[] { "application/json" },
                    parameters = new List<Parameter>
                {
                    new Parameter
                    {
                        name = "username",
                        @in = "formData",
                        type = "string"
                    },
                    new Parameter
                    {
                        name = "password",
                        @in = "formData",
                        type = "string"
                    },
                    new Parameter
                    {
                        name = "grant_type",
                        @in = "formData",
                        type = "string"
                    },
                    new Parameter
                    {
                        name = "client_id",
                        @in = "formData",
                        type = "string"
                    }
                },
                    responses = new Dictionary<string, Response>
                    {
                        {
                            "200",
                            new Response
                            {
                                description = "OK",
                                schema = new Schema
                                {
                                    @ref="#/definitions/OAuth2TokenPostResponse"
                                }
                            }
                        }
                    }
                }
            });
        }
    }
}
