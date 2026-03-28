$port = 8080
$listener = New-Object Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath.Replace('/', '\')
        if ($localPath -eq '\') { $localPath = '\index.html' }
        $fullPath = Join-Path -Path $PWD.Path -ChildPath $localPath
        
        if (Test-Path $fullPath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            if ($fullPath.EndsWith('.html')) { $response.ContentType = 'text/html' }
            elseif ($fullPath.EndsWith('.css')) { $response.ContentType = 'text/css' }
            elseif ($fullPath.EndsWith('.js')) { $response.ContentType = 'application/javascript' }
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.OutputStream.Close()
        } else {
            $response.StatusCode = 404
            $response.OutputStream.Close()
        }
    }
} finally {
    $listener.Stop()
}
