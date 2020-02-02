using Swashbuckle.Swagger;
using System.Linq;
using System.Web.Http.Description;

namespace Swashbuckle.Extensions
{

    /// <summary>
    /// Add UrlEncoded form data support for Controller Actions that have FromFormDataBody attribute in a parameter
	/// usage: c.OperationFilter<AddUrlFormDataParams>();
    /// </summary>
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
