using Swashbuckle.Swagger;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Http.Description;

namespace Swashbuckle.Extensions
{

    /// <summary>
    /// usage: c.OperationFilter<HandleFromHeaderParams>();
    /// public apiControllerMethodName([FromHeader("X-Request-ID")] string X_Request_ID = "")
    /// </summary>
    public class HandleFromHeaderParams : IOperationFilter
    {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="operation"></param>
        /// <param name="schemaRegistry"></param>
        /// <param name="apiDescription"></param>
        public void Apply(Operation operation, SchemaRegistry schemaRegistry, ApiDescription apiDescription)
        {
            var fromHeaderAttributes = apiDescription.ActionDescriptor.GetParameters()
                .Where(param => param.GetCustomAttributes<FromHeaderAttribute>().Any())
            .ToArray();

            foreach (var headerParam in fromHeaderAttributes)
            {
                var operationParameter = operation.parameters.First(p => p.name == headerParam.ParameterName);

                operationParameter.name = headerParam.ParameterName;
                operationParameter.@in = "header";
                operationParameter.type = "string";
            }

        }
    }
}
