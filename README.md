SSLinstall

``` sudo snap install --classic certbot ```

prepare certbot

```sudo ln -s /snap/bin/certbot /user/bin/certbot``` 


generate ssl

```sudo certbot --nginx```

test
``` sudo certbot renew --dry-run```
TODO: SETUp NGINX in corect whey



 ``` German Wiki Doc
 
  /api/german-wiki/search/:word
  /api/german-wiki/page/:id
