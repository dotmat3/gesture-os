import eventlet
import socketio

sio = socketio.Server()
app = socketio.WSGIApp(sio)

@sio.event
def connect(sid, environ):
  print('connect ', sid)

  sio.emit("test", "From python")

@sio.on('get-data-python')
def msg(sid, data):
  print('message ', data)
  return "OK", "Test data from python"

@sio.event
def disconnect(sid):
  print('disconnect ', sid)

if __name__ == '__main__':
  eventlet.wsgi.server(eventlet.listen(('', 5000)), app)
