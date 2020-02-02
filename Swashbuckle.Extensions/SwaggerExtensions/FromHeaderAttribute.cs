using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Controllers;
using System.Web.Http.Metadata;

namespace MYOBApiProxy.SwaggerExtensions
{
    internal class FromHeaderAttribute : ParameterBindingAttribute
    {
        private string name;

        public FromHeaderAttribute(string headerName)
        {
            this.name = headerName;
        }

        public override HttpParameterBinding GetBinding(HttpParameterDescriptor parameter)
        {
            return new FromHeaderBinding(parameter, this.name);
        }
    }
    internal class FromHeaderBinding : HttpParameterBinding
    {
        private readonly string _name;
        private readonly bool _optional;
        private readonly object _defaultValue;

        public FromHeaderBinding(HttpParameterDescriptor parameter, string headerName)
            : base(parameter)
        {
            if (string.IsNullOrEmpty(headerName)) throw new ArgumentNullException("headerName");
            _name = headerName;
            _optional = parameter.IsOptional;
            _defaultValue = parameter.DefaultValue;
        }

        public override Task ExecuteBindingAsync(ModelMetadataProvider metadataProvider, HttpActionContext actionContext, CancellationToken cancellationToken)
        {
            IEnumerable<string> values;
            if (actionContext.Request.Headers.TryGetValues(_name, out values))
            {
                var tempVal = values.FirstOrDefault();
                if (tempVal != null)
                {
                    var actionValue = Convert.ChangeType(tempVal, Descriptor.ParameterType);
                    actionContext.ActionArguments[this.Descriptor.ParameterName] = actionValue;
                }
            }
            else if (actionContext.Request.Headers.TryGetValues(_name.Replace("-", "_"), out values))
            {
                var tempVal = values.FirstOrDefault();
                if (tempVal != null)
                {
                    var actionValue = Convert.ChangeType(tempVal, Descriptor.ParameterType);
                    actionContext.ActionArguments[this.Descriptor.ParameterName] = actionValue;
                }
            }
            else if (_optional)
            {
                actionContext.ActionArguments.Add(this.Descriptor.ParameterName, _defaultValue);
            }
            var taskSource = new TaskCompletionSource<object>();
            taskSource.SetResult(null);
            return taskSource.Task;
        }
    }
}