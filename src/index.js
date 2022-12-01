import app from './app';
import './conection';


// server is listening

app.listen(app.get('port'), function(){
    console.log('server on port', app.get('port'));
});

