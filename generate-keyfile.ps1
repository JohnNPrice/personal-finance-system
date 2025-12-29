$bytes = New-Object byte[] 756
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[System.IO.File]::WriteAllBytes("mongo-keyfile", $bytes)
