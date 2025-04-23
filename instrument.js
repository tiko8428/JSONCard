const Sentry = require('@sentry/node');

if(process.env.NODE_ENV === 'production'){
  Sentry.init({
    dsn: "https://cd86f71e3d27a9262c31f4e508088a6b@o4509204419182592.ingest.de.sentry.io/4509204422983760",
  });
}
