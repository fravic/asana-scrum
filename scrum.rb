ASANA_API_URL = 'https://app.asana.com/api/1.0'

class Scrum < Sinatra::Base
  set :sessions, true

  use Rack::ReverseProxy do |rprox|
    reverse_proxy /^\/(?!css)(?!js)(?!auth)(.+)$/, ASANA_API_URL + '/$1', :password => ''
  end

  configure :production do
    use Rack::SslEnforcer
  end

  get '/' do
    File.read('public/index.html')
  end

  get '/auth' do
    session[:username] = params[:auth]
  end

  run! if app_file == $0
end
