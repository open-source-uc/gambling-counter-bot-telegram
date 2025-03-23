echo "Seleccione el modo de ejecución:"
echo "1) Local"
echo "2) Remoto"
read -p "Opción (1/2): " mode

if [ "$mode" == "1" ]; then
    FLAG="--local"
elif [ "$mode" == "2" ]; then
    FLAG="--remote"
else
    echo "Opción inválida. Saliendo."
    exit 1
fi

npx wrangler d1 execute gambling-counter $FLAG --file=./tables.sql -y
echo "Tablas creadas"