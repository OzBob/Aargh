using System;
using System.Collections.Generic;
using System.Net.Http.Formatting;
using System.Web.Http;
using System.Web.Http.Controllers;
using System.Web.Http.Validation;

namespace Swashbuckle.Extensions
{
    /// <summary>
    /// FromFormDataBody Attribute
    /// This attribute is used on action parameters to indicate
    /// they come only from the content body of the incoming HttpRequestMessage.
    /// </summary>
    [AttributeUsage(AttributeTargets.Parameter, Inherited = true, AllowMultiple = false)]
    public sealed class FromFormDataBodyAttribute : ParameterBindingAttribute
    {
        /// <summary>
        /// GetBinding
        /// </summary>
        /// <param name="parameter">HttpParameterDescriptor</param>
        /// <returns>HttpParameterBinding</returns>
        public override HttpParameterBinding GetBinding(HttpParameterDescriptor parameter)
        {
            if (parameter == null)
                throw new ArgumentNullException("parameter");

            IEnumerable<MediaTypeFormatter> formatters = parameter.Configuration.Formatters;
            IBodyModelValidator validator = parameter.Configuration.Services.GetBodyModelValidator();

            return parameter.BindWithFormatter(formatters, validator);
        }
    }
}