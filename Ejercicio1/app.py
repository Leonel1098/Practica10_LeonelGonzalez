from flask import Flask, render_template, request, redirect, url_for, flash
from pymongo import MongoClient

app = Flask(__name__)
app.secret_key = "secret_key" 

# Conecxion  a MongoDB, se crea la base de datos en Mongo Atlas  
def get_db():
    client = MongoClient("mongodb+srv://gonzalezleonel1098:Leonel10@cluster0.uapuf.mongodb.net/")
    db = client['Practica10_BD']
    return db

# Ruta de inicio donde se muestran los clientes que esten en la coleccion clientes de la base de datos 
@app.route('/')
def index():
    db = get_db()
    clientes = list(db.clientes.find())  
    return render_template('index.html', clientes=clientes)

# Ruta para crear un cliente nuevo y agregarlo a la base de datos 
@app.route('/agregar', methods=['GET', 'POST'])
def agregar_cliente():
    if request.method == 'POST':
        nombre = request.form['nombre']
        edad = int(request.form['edad'])
        ciudad = request.form['ciudad']
        db = get_db()
        db.clientes.insert_one({"nombre": nombre, "edad": edad, "ciudad": ciudad})
        flash("Cliente agregado exitosamente")
        return redirect(url_for('index'))
    return render_template('agregar.html')

# Ruta para realizar la consulta de los clientes usando la ciudad como filtro de busqueda
@app.route('/consultar', methods=['GET', 'POST'])
def consultar_cliente():
    if request.method == 'POST':
        ciudad = request.form['ciudad']
        db = get_db()
        resultados = db.clientes.find({"ciudad": ciudad})
        clientes = list(resultados)
        return render_template('resultado.html', clientes=clientes, ciudad=ciudad)
    return render_template('consultar.html')

# Ruta para eliminar cliente por nombre en la base de datos 
@app.route('/eliminar', methods=['GET', 'POST'])
def eliminar_cliente():
    if request.method == 'POST':
        nombre = request.form['nombre']
        db = get_db()
        resultado = db.clientes.delete_one({"nombre": nombre})
        if resultado.deleted_count > 0:
            flash(f"Cliente '{nombre}' eliminado exitosamente")
        else:
            flash(f"No se encontró un cliente con el nombre '{nombre}'")
        return redirect(url_for('index'))
    return render_template('eliminar.html')

if __name__ == '__main__':
    app.run(debug=True)
