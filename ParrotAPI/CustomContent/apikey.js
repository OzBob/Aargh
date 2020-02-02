(function () {
    $(function () {
        console.log("loaded custom basic auth");
        $('#input_apiKey').off();
        $('#input_apiKey').on('change', function () {
            var key = this.value;
            console.log("custom key: " + key);
            if (key && key.trim() !== '') {
                var apiKeyAuth = new SwaggerClient.ApiKeyAuthorization("x-exaltapi-key", key, "header");
                window.swaggerUi.api.clientAuthorizations.add("x-exaltapi-key", apiKeyAuth);
                /*window.Headers.add("x-myobapi-key", apiKeyAuth);
                var basicAuthKey = new SwaggerClient.ApiKeyAuthorization("Authorization", key, "header")
                window.ApiKeyAuthorization.add("key", basicAuthKey)
                //window.authorizations.add("key", new SwaggerClient.ApiKeyAuthorization("Authorization", basicAuth, "header"));                
                //window.swaggerUi.api.clientAuthorizations.add("key", basicAuthKey);
                var apiKeyAuth = new SwaggerClient.ApiKeyAuthorization("api_key", key, "header");
                swaggerUi.api.clientAuthorizations.add("key", new SwaggerClient.ApiKeyAuthorization("api_key", key, "header"));
                */
                console.log("added key " + key);
            }
        });

        $('#explore').off();
        $('#explore').click(function () {

            //if have token don't prompt again
            //
            if (window.swaggerUi.api.clientAuthorizations.authz.Authorization === undefined) {
                var credentials_un = prompt("Username");
                var credentials_password = prompt("Password");
                var client_id = $('#input_apiKey')[0].value;

                $.ajax({
                    url: document.location.origin + "/token",
                    type: "post",
                    contenttype: 'x-www-form-urlencoded',
                    data: "grant_type=password&username=" + credentials_un + "&password=" + credentials_password + "&client_id=" + client_id,
                    success: function (response) {
                        var bearerToken = 'Bearer ' + response.access_token;
                        window.swaggerUi.api.clientAuthorizations.add('Authorization', new SwaggerClient.ApiKeyAuthorization('Authorization', bearerToken, 'header'));
                        alert("Login successfull");
                    },
                    error: function (xhr, ajaxoptions, thrownerror) {
                        alert("Login failed!");
                    }
                });
            }
        });
        /*
        */
    });
})();