using Swashbuckle.Swagger;
using System;

namespace Swashbuckle.Extensions
{
    public class UnderScoreSchmeaFormatter : ISchemaFilter
    {
        public void Apply(Schema schema, SchemaRegistry schemaRegistry, Type type)
        {
            //schema.vendorExtensions.Add("x-schema", "bar");
        }
    }
}