
//  INSTITUCIÓN EDUCATIVA — script.js
//  Login + Bienvenido + CRUD con parámetros de URL 



//  1. MÓDULO LOGIN (iniciosesion.html)


const usuariosRegistrados = [
    { usuario: "erica@gruporoldan.com.co", clave: "2146" },
    { usuario: "profesor@inst.edu.co",    clave: "1234" }
];

let intentosRealizados = 0;
const maximoIntentos = 3;

function validarAcceso() {
    const userIn = document.getElementById('email').value.trim();
    const passIn = document.getElementById('password').value;
    const status = document.getElementById('mensaje-estado');
    let accesoConcedido = false;

    for (let i = 0; i < usuariosRegistrados.length; i++) {
        if (userIn === usuariosRegistrados[i].usuario && passIn === usuariosRegistrados[i].clave) {
            accesoConcedido = true;
            break;
        }
    }

    if (accesoConcedido) {
        localStorage.setItem('sesionActiva', 'true');
        localStorage.setItem('usuarioActual', userIn);
        status.style.color = "#14be23";
        status.innerText = "¡ACCESO EXITOSO! Redirigiendo...";
        setTimeout(() => { window.location.href = "bienvenido.html"; }, 1500);
    } else {
        intentosRealizados++;
        const restantes = maximoIntentos - intentosRealizados;
        if (restantes > 0) {
            status.style.color = "#d97706";
            status.innerText = `Datos incorrectos. Intento ${intentosRealizados} de ${maximoIntentos}.`;
        } else {
            status.style.color = "#dc2626";
            status.innerText = "USUARIO BLOQUEADO: Contacte a soporte técnico.";
            document.getElementById('btn-login').disabled = true;
            document.getElementById('btn-login').style.opacity = "0.5";
        }
    }
}

if (document.getElementById('btn-login')) {
    document.getElementById('btn-login').addEventListener('click', function(e) {
        e.preventDefault();
        validarAcceso();
    });
    ['email', 'password'].forEach(function(id) {
        document.getElementById(id).addEventListener('keydown', function(e) {
            if (e.key === 'Enter') validarAcceso();
        });
    });
}


//  2. MÓDULO BIENVENIDO (bienvenido.html)


if (document.getElementById('usuario-activo')) {

    // Verificar sesión
    if (localStorage.getItem('sesionActiva') !== 'true') {
        window.location.href = 'iniciosesion.html';
    }

    // Mostrar usuario activo en el DOM
    const usuarioGuardado = localStorage.getItem('usuarioActual') || 'Usuario';
    document.getElementById('usuario-activo').innerText = usuarioGuardado;

    // Cerrar sesión
    document.getElementById('btn-cerrar-sesion').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('sesionActiva');
        localStorage.removeItem('usuarioActual');
        window.location.href = 'iniciosesion.html';
    });

    // Mostrar resumen de usuarios desde localStorage
    const usuariosGuardados = JSON.parse(localStorage.getItem('usuariosApp')) || [];
    const totalEst = usuariosGuardados.filter(u => u.rol === 'Estudiante').length;
    const totalDoc = usuariosGuardados.filter(u => u.rol === 'Docente').length;

    document.getElementById('res-estudiantes').innerText = totalEst;
    document.getElementById('res-docentes').innerText    = totalDoc;
    document.getElementById('res-total').innerText       = usuariosGuardados.length;
}



//  3. MÓDULO CRUD — REGISTRO (registro.html)


if (document.getElementById('tbody-usuarios')) {

    // Verificar sesión
    if (localStorage.getItem('sesionActiva') !== 'true') {
        window.location.href = 'iniciosesion.html';
    }

    //  Leer parámetros de la URL 
    // Ejemplo: registro.html?modo=registrar&rol=Estudiante
    const params   = new URLSearchParams(window.location.search);
    const modoURL  = params.get('modo') || 'registrar';   // 'registrar' | 'actualizar'
    const rolURL   = params.get('rol')  || '';             // 'Estudiante' | 'Docente'

    //  Configurar interfaz según modo y rol 
    function configurarModo() {
        const formTitulo    = document.getElementById('form-titulo');
        const formSubtitulo = document.getElementById('form-subtitulo');
        const tablaTitulo   = document.getElementById('tabla-titulo');
        const tablaSubtitulo= document.getElementById('tabla-subtitulo');
        const inpRol        = document.getElementById('inp-rol');
        const filtroRol     = document.getElementById('sel-filtro-rol');

        if (rolURL) {
            // Pre-seleccionar el rol en el formulario
            inpRol.value = rolURL;
            grupoGrado.style.display = 'block';
            document.getElementById('inp-grado').placeholder =
                rolURL === 'Docente' ? 'Ej: Matemáticas' : 'Ej: 10°A';

            // Filtrar tabla automáticamente por rol
            filtroRol.value = rolURL;
        }

        if (modoURL === 'registrar') {
            formTitulo.innerText     = rolURL ? `Registrar ${rolURL}` : 'Registrar Usuario';
            formSubtitulo.innerText  = `Completa los campos para agregar un nuevo ${rolURL || 'usuario'}.`;
            tablaTitulo.innerText    = rolURL ? `${rolURL}s Registrados` : 'Usuarios Registrados';
            tablaSubtitulo.innerText = `Lista de ${rolURL ? rolURL.toLowerCase() + 's' : 'usuarios'} en el sistema`;
        } else {
            formTitulo.innerText     = rolURL ? `Actualizar ${rolURL}` : 'Actualizar Usuario';
            formSubtitulo.innerText  = `Selecciona un registro de la tabla para editarlo.`;
            tablaTitulo.innerText    = rolURL ? `${rolURL}s — Selecciona uno para editar` : 'Selecciona un usuario para editar';
            tablaSubtitulo.innerText = `Haz clic en "✏️ Editar" en la fila que deseas modificar`;
        }
    }

    // Variables y datos 
    let listaUsuarios = JSON.parse(localStorage.getItem('usuariosApp')) || [];
    let modoEdicion   = false;
    let idEditando    = null;

    const inpRol     = document.getElementById('inp-rol');
    const grupoGrado = document.getElementById('grupo-grado');

    //  Mostrar/ocultar campo Grado según rol 
    inpRol.addEventListener('change', function() {
        grupoGrado.style.display = this.value ? 'block' : 'none';
        document.getElementById('inp-grado').placeholder =
            this.value === 'Docente' ? 'Ej: Matemáticas' : 'Ej: 10°A';
    });

    // Renderizar tabla 
    function renderizarTabla(lista) {
        const tbody = document.getElementById('tbody-usuarios');
        const vacio = document.getElementById('lista-vacia');
        const tabla = document.getElementById('tabla-usuarios');

        // Eliminar todos los nodos hijos (manipulación del DOM)
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }

        if (lista.length === 0) {
            tabla.style.display = 'none';
            vacio.style.display = 'block';
        } else {
            tabla.style.display = 'table';
            vacio.style.display = 'none';

            lista.forEach(function(usuario, index) {
                // Crear nodo fila (createElement)
                const fila = document.createElement('tr');
                fila.setAttribute('data-id', usuario.id);
                const badgeClass = usuario.rol === 'Docente' ? 'docente' : 'estudiante';

                fila.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${usuario.nombre}</td>
                    <td>${usuario.documento}</td>
                    <td>${usuario.correo}</td>
                    <td><span class="badge-rol ${badgeClass}">${usuario.rol}</span></td>
                    <td>${usuario.grado || '—'}</td>
                    <td>
                        <button class="btn-edit" data-id="${usuario.id}"> ✏ Editar</button>
                        <button class="btn-del"  data-id="${usuario.id}"> 🗑 Eliminar</button>
                    </td>
                `;
                tbody.appendChild(fila); // Añadir nodo al DOM
            });

            // Eventos editar y eliminar
            tbody.querySelectorAll('.btn-edit').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    cargarEdicion(this.getAttribute('data-id'));
                });
            });

            tbody.querySelectorAll('.btn-del').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    eliminarUsuario(this.getAttribute('data-id'));
                });
            });
        }

        actualizarContadores(lista);
    }

    // Contadores 
    function actualizarContadores(lista) {
        const total = listaUsuarios.length; // Total real siempre
        const est   = listaUsuarios.filter(u => u.rol === 'Estudiante').length;
        const doc   = listaUsuarios.filter(u => u.rol === 'Docente').length;
        document.getElementById('cnt-total').innerText       = `Total: ${total}`;
        document.getElementById('cnt-estudiantes').innerText = `Estudiantes: ${est}`;
        document.getElementById('cnt-docentes').innerText    = `Docentes: ${doc}`;
    }

    // Guardar usuario 
    document.getElementById('btn-guardar').addEventListener('click', function() {
        const nombre    = document.getElementById('inp-nombre').value.trim();
        const documento = document.getElementById('inp-documento').value.trim();
        const correo    = document.getElementById('inp-correo').value.trim();
        const rol       = document.getElementById('inp-rol').value;
        const grado     = document.getElementById('inp-grado').value.trim();
        const msgForm   = document.getElementById('msg-form');

        if (!nombre || !documento || !correo || !rol) {
            msgForm.style.color = '#dc2626';
            msgForm.innerText = ' Completa todos los campos obligatorios.';
            return;
        }

        if (modoEdicion) {
            // Actualizar -  modificar registro existente
            listaUsuarios = listaUsuarios.map(function(u) {
                return u.id === idEditando ? { ...u, nombre, documento, correo, rol, grado } : u;
            });
            msgForm.style.color = '#16a34a';
            msgForm.innerText = 'Registro actualizado correctamente.';
            cancelarEdicion();
        } else {
            // CREATE — nuevo registro
            listaUsuarios.push({
                id: Date.now().toString(),
                nombre, documento, correo, rol, grado
            });
            msgForm.style.color = '#16a34a';
            msgForm.innerText = 'Registro guardado correctamente.';
        }

        localStorage.setItem('usuariosApp', JSON.stringify(listaUsuarios));
        limpiarFormulario();
        filtrarTabla(); // Re-renderizar respetando filtro activo
        setTimeout(function() { msgForm.innerText = ''; }, 3000);
    });

    //  Cargar para editar 
    function cargarEdicion(id) {
        const usuario = listaUsuarios.find(u => u.id === id);
        if (!usuario) return;

        modoEdicion = true;
        idEditando  = id;

        // Actualizar nodos del formulario (DOM)
        document.getElementById('inp-nombre').value    = usuario.nombre;
        document.getElementById('inp-documento').value = usuario.documento;
        document.getElementById('inp-correo').value    = usuario.correo;
        document.getElementById('inp-rol').value       = usuario.rol;
        document.getElementById('inp-grado').value     = usuario.grado || '';
        grupoGrado.style.display = 'block';

        document.getElementById('form-titulo').innerText = '✏️ Editando registro';
        document.getElementById('btn-cancelar').style.display = 'block';
        document.querySelector('.registro-sidebar').scrollIntoView({ behavior: 'smooth' });
    }

    //  Cancelar edición 
    document.getElementById('btn-cancelar').addEventListener('click', cancelarEdicion);

    function cancelarEdicion() {
        modoEdicion = false;
        idEditando  = null;
        document.getElementById('form-titulo').innerText =
            modoURL === 'actualizar'
                ? (rolURL ? `Actualizar ${rolURL}` : 'Actualizar Usuario')
                : (rolURL ? `Registrar ${rolURL}` : 'Registrar Usuario');
        document.getElementById('btn-cancelar').style.display = 'none';
        limpiarFormulario();
    }

    //  Eliminar usuario 
    function eliminarUsuario(id) {
        const usuario = listaUsuarios.find(u => u.id === id);
        if (!usuario) return;

        if (confirm(`¿Eliminar a "${usuario.nombre}"? Esta acción no se puede deshacer.`)) {
            listaUsuarios = listaUsuarios.filter(u => u.id !== id);
            localStorage.setItem('usuariosApp', JSON.stringify(listaUsuarios));

            // Remover nodo directamente del DOM
            const fila = document.querySelector(`tr[data-id="${id}"]`);
            if (fila) fila.remove();

            actualizarContadores(listaUsuarios);
            if (listaUsuarios.length === 0) renderizarTabla([]);
        }
    }

    // Limpiar formulario
    function limpiarFormulario() {
        document.getElementById('inp-nombre').value    = '';
        document.getElementById('inp-documento').value = '';
        document.getElementById('inp-correo').value    = '';
        if (!rolURL) {
            document.getElementById('inp-rol').value   = '';
            grupoGrado.style.display = 'none';
        }
        document.getElementById('inp-grado').value = '';
    }

    // Buscador y filtro en tiempo real 
    document.getElementById('inp-buscar').addEventListener('input', filtrarTabla);
    document.getElementById('sel-filtro-rol').addEventListener('change', filtrarTabla);

    function filtrarTabla() {
        const texto = document.getElementById('inp-buscar').value.toLowerCase();
        const rol   = document.getElementById('sel-filtro-rol').value;

        const filtrada = listaUsuarios.filter(function(u) {
            const coincideTexto = u.nombre.toLowerCase().includes(texto) ||
                                  u.documento.includes(texto) ||
                                  u.correo.toLowerCase().includes(texto);
            const coincideRol   = rol === '' || u.rol === rol;
            return coincideTexto && coincideRol;
        });

        renderizarTabla(filtrada);
    }

    // Panel de estilo dinámico
    document.getElementById('btn-aplicar-estilo').addEventListener('click', function() {
        // Cambiar fondo del body (style via DOM, sin recargar)
        document.body.style.backgroundColor = document.getElementById('sel-fondo').value;

        // Cambiar tamaño de fuente de la tabla
        const tabla = document.getElementById('tabla-usuarios');
        if (tabla) tabla.style.fontSize = document.getElementById('sel-fuente').value;

        // Cambiar tema del encabezado de la tabla
        const temaTabla = document.getElementById('sel-tema-tabla').value;
        const wrapper   = document.getElementById('tabla-wrapper');
        wrapper.classList.remove('tema-azul', 'tema-verde');
        if (temaTabla === 'azul')  wrapper.classList.add('tema-azul');
        if (temaTabla === 'verde') wrapper.classList.add('tema-verde');

        // Feedback visual en el botón (nodo del DOM)
        const btn = document.getElementById('btn-aplicar-estilo');
        const textoOriginal = btn.innerText;
        btn.innerText = 'Aplicado';
        btn.style.background = '#16a34a';
        setTimeout(function() {
            btn.innerText = textoOriginal;
            btn.style.background = '';
        }, 1800);
    });

    //  Cerrar sesión
    const btnCerrar = document.getElementById('btn-cerrar-sesion');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('sesionActiva');
            localStorage.removeItem('usuarioActual');
            window.location.href = 'iniciosesion.html';
        });
    }

    //  Inicializar
    configurarModo();
    filtrarTabla();
}