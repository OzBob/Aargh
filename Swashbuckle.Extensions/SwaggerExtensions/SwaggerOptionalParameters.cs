using Swashbuckle.Swagger;
using System.Linq;
using System.Web.Http.Description;

namespace MYOBApiProxy.SwaggerExtensions
{
    /// <summary>
    /// Sets Swagger documentation for parameter's 'required' value to false
    /// When Paratmee
    /// </summary>
    public class SwaggerOptionalParameters : IOperationFilter
    {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="operation"></param>
        /// <param name="schemaRegistry"></param>
        /// <param name="apiDescription"></param>
        public void Apply(Operation operation, SchemaRegistry schemaRegistry, ApiDescription apiDescription)
        {
            try
            {
                var parameterValuePairs =
                    apiDescription.ActionDescriptor.GetParameters()
                 .Where(parameter => parameter.IsOptional)
                        .Select(p => p);

                foreach (var param in parameterValuePairs.ToList())
                {
                    var opParam = operation.parameters.Single(p => p.name == param.ParameterName);
                    if (opParam != null)
                        opParam.required = false;
                }
                //foreach (var param in operation.parameters)
                //{
                //    object defaultValue;
                //    if (parameterValuePairs.TryGetValue(param.name, out defaultValue))
                //        param.required = false;
                //}
            }
            catch { }
        }
    }
}