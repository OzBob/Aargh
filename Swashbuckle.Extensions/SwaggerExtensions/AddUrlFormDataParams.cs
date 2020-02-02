using Swashbuckle.Swagger;
using System.Linq;
using System.Web.Http.Description;

namespace MYOBApiProxy.SwaggerExtensions
{
    // Disable all XML Comment warnings in this file // 
#pragma warning disable 1591

    public class AddUrlFormDataParams : IOperationFilter
    {
        public void Apply(Operation operation, SchemaRegistry schemaRegistry, ApiDescription apiDescription)
        {
            var fromBodyAttributes = apiDescription.ActionDescriptor.GetParameters()
                .Where(param => param.GetCustomAttributes<FromFormDataBodyAttribute>().Any())
            .ToArray();

            if (fromBodyAttributes.Any())
                operation.consumes.Add("application/x-www-form-urlencoded");

            foreach (var headerParam in fromBodyAttributes)
            {
                if (operation.parameters != null)
                {
                    // Select the capitalized parameter names
                    var parameter = operation.parameters.Where(p => p.name == headerParam.ParameterName).FirstOrDefault();
                    if (parameter != null)
                    {
                        parameter.@in = "query";//todo change to "formData" when http://vstfrd:8080/Azure/RD/_workitems/edit/3172874 in autorest is completed
                    }
                }
            }
        }
    }
}
