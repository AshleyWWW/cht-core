var app = require('express')(),
    proxy = require('http-proxy').createProxyServer({}),
    auditProxy = require('./audit-proxy'),
    db = require('./db'),
    auth = require('./auth'),
    target = 'http://' + db.client.host + ':' + db.client.port,
    activePregnancies = require('./controllers/active-pregnancies'),
    upcomingAppointments = require('./controllers/upcoming-appointments'),
    missedAppointments = require('./controllers/missed-appointments'),
    upcomingDueDates = require('./controllers/upcoming-due-dates'),
    highRisk = require('./controllers/high-risk'),
    totalBirths = require('./controllers/total-births'),
    missingDeliveryReports = require('./controllers/missing-delivery-reports'),
    deliveryLocation = require('./controllers/delivery-location'),
    visitsCompleted = require('./controllers/visits-completed'),
    visitsDuring = require('./controllers/visits-during'),
    monthlyRegistrations = require('./controllers/monthly-registrations'),
    monthlyDeliveries = require('./controllers/monthly-deliveries');
  
var audit = function(req, res) {
  auditProxy.onMatch(proxy, req, res, target);
};

var auditPath = '/' + db.name + '/*';
app.put(auditPath, audit);
app.post(auditPath, audit);
app.delete(auditPath, audit);

var handleApiCall = function(req, res, controller) {
  auth.getUsername(req, function(err) {
    if (err) {
      notLoggedIn(err, res);
    } else {
      controller.get({ district: req.query.district }, function(err, obj) {
        if (err) {
          serverError(err, res);
        } else {
          res.json(obj);
        }
      });
    }
  });
};

app.get('/api/active-pregnancies', function(req, res) {
  handleApiCall(req, res, activePregnancies);
});

app.get('/api/upcoming-appointments', function(req, res) {
  handleApiCall(req, res, upcomingAppointments);
});

app.get('/api/missed-appointments', function(req, res) {
  handleApiCall(req, res, missedAppointments);
});

app.get('/api/upcoming-due-dates', function(req, res) {
  handleApiCall(req, res, upcomingDueDates);
});

app.get('/api/high-risk', function(req, res) {
  handleApiCall(req, res, highRisk);
});

app.get('/api/total-births', function(req, res) {
  handleApiCall(req, res, totalBirths);
});

app.get('/api/missing-delivery-reports', function(req, res) {
  handleApiCall(req, res, missingDeliveryReports);
});

app.get('/api/delivery-location', function(req, res) {
  handleApiCall(req, res, deliveryLocation);
});

app.get('/api/visits-completed', function(req, res) {
  handleApiCall(req, res, visitsCompleted);
});

app.get('/api/visits-during', function(req, res) {
  handleApiCall(req, res, visitsDuring);
});

app.get('/api/monthly-registrations', function(req, res) {
  handleApiCall(req, res, monthlyRegistrations);
});

app.get('/api/monthly-deliveries', function(req, res) {
  handleApiCall(req, res, monthlyDeliveries);
});

app.all('*', function(req, res) {
  proxy.web(req, res, { target: target });
});

var error = function(res, code, message) {
  res.writeHead(code, { 'Content-Type': 'text/plain' });
  res.end(message);
};

var serverError = function(err, res) {
  console.error('Server error : ' + err);
  error(res, 500, 'Server error');
};

var notLoggedIn = function(err, res) {
  error(res, 403, 'Not logged in');
};

app.use(function(err, req, res, next) {
  serverError(err.stack, res);
});

proxy.on('error', function(err, req, res) { 
  serverError(JSON.stringify(err), res);
});

app.listen(5988, function() {
  console.log('Listening on port 5988');
});
