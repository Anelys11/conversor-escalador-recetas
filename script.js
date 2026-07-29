document.addEventListener('DOMContentLoaded', () => {
    // -----------------------------------------
    // 1. UTILIDADES Y UI BÁSICA
    // -----------------------------------------
    const navbar = document.querySelector('.navbar');
    const backToTop = document.getElementById('backToTop');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-links a');

    // Scroll Navbar y BackToTop
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');

        if (window.scrollY > 500) backToTop.classList.add('visible');
        else backToTop.classList.remove('visible');

        // Nav Activo
        let current = '';
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            if (scrollY >= (section.offsetTop - section.clientHeight / 3)) {
                current = section.getAttribute('id');
            }
        });
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href').includes(current) && current !== '') {
                item.classList.add('active');
            }
        });
    });

    // Mobile menu
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = mobileMenuBtn.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
    });
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navLinks.classList.remove('active');
            mobileMenuBtn.querySelector('i').classList.replace('fa-times', 'fa-bars');
        });
    });

    // Sistema de Notificaciones (Toasts)
    const showToast = (message, type = 'info') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'fa-info-circle';
        if (type === 'error') icon = 'fa-exclamation-circle';
        if (type === 'success') icon = 'fa-check-circle';

        toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    };

    // -----------------------------------------
    // 2. GESTOR DE RECETAS (CRUD y LocalStorage)
    // -----------------------------------------
    const StorageKey = 'escalaCocinaRecetas';
    let recetasGuardadas = JSON.parse(localStorage.getItem(StorageKey)) || [];

    const saveToLocalStorage = () => {
        localStorage.setItem(StorageKey, JSON.stringify(recetasGuardadas));
        renderMisRecetas();
    };

    const getRecetaById = (id) => recetasGuardadas.find(r => r.id === id);

    // Elementos DOM Gestor
    const seccionMisRecetas = document.querySelector('.mis-recetas-section');
    const seccionCrearReceta = document.getElementById('crear-receta-section');
    const btnNuevaReceta = document.getElementById('btn-nueva-receta');
    const btnCancelarReceta = document.getElementById('btn-cancelar-receta');
    const formReceta = document.getElementById('receta-form');
    const listaIngredientes = document.getElementById('ingredientes-lista');
    const btnAddIngrediente = document.getElementById('btn-add-ingrediente');
    const gridRecetas = document.getElementById('mis-recetas-grid');
    const totalRecetasSpan = document.getElementById('total-recetas');
    const buscarInput = document.getElementById('buscar-receta');
    const ordenarSelect = document.getElementById('ordenar-receta');

    // Cambiar vistas
    const showCrearReceta = (editId = null) => {
        seccionMisRecetas.style.display = 'none';
        seccionCrearReceta.style.display = 'block';
        listaIngredientes.innerHTML = '';
        
        if (editId) {
            document.getElementById('form-titulo').textContent = 'Editar Receta';
            llenarFormulario(getRecetaById(editId));
        } else {
            document.getElementById('form-titulo').textContent = 'Crear Nueva Receta';
            formReceta.reset();
            document.getElementById('receta-id').value = '';
            addIngredienteRow(); // Una fila por defecto
        }
    };

    const hideCrearReceta = () => {
        seccionCrearReceta.style.display = 'none';
        seccionMisRecetas.style.display = 'block';
    };

    btnNuevaReceta.addEventListener('click', () => showCrearReceta());
    btnCancelarReceta.addEventListener('click', hideCrearReceta);

    // Filas Dinámicas de Ingredientes
    const getOptionsUnidades = () => `
        <option value="g">gramos (g)</option>
        <option value="kg">kilogramos (kg)</option>
        <option value="ml">mililitros (ml)</option>
        <option value="l">litros (L)</option>
        <option value="tazas">tazas</option>
        <option value="cda">cucharadas</option>
        <option value="cdta">cucharaditas</option>
        <option value="oz">onzas</option>
        <option value="lb">libras</option>
        <option value="unidades">unidades/piezas</option>
    `;

    const addIngredienteRow = (nombre = '', cant = '', unidad = 'g') => {
        const div = document.createElement('div');
        div.className = 'ingrediente-row';
        div.innerHTML = `
            <div class="form-group flex-2">
                <input type="text" class="ing-nombre" placeholder="Ingrediente (ej. Harina)" value="${nombre}" required>
            </div>
            <div class="form-group">
                <input type="number" class="ing-cant" min="0.01" step="any" placeholder="Cant." value="${cant}" required>
            </div>
            <div class="form-group">
                <select class="ing-unidad">
                    ${getOptionsUnidades()}
                </select>
            </div>
            <button type="button" class="btn-remove-ing" title="Eliminar ingrediente"><i class="fas fa-trash"></i></button>
        `;
        div.querySelector('.ing-unidad').value = unidad;
        
        div.querySelector('.btn-remove-ing').addEventListener('click', () => {
            if (listaIngredientes.children.length > 1) div.remove();
            else showToast('Debe haber al menos un ingrediente', 'error');
        });
        
        listaIngredientes.appendChild(div);
    };

    btnAddIngrediente.addEventListener('click', () => addIngredienteRow());

    // Guardar Receta
    formReceta.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = document.getElementById('receta-id').value;
        const nombre = document.getElementById('receta-nombre').value.trim();
        const categoria = document.getElementById('receta-categoria').value;
        const tiempo = document.getElementById('receta-tiempo').value;
        const dificultad = document.getElementById('receta-dificultad').value;
        const porciones = parseFloat(document.getElementById('receta-porciones').value);
        const notas = document.getElementById('receta-notas').value.trim();
        
        if (porciones <= 0) return showToast('Las porciones deben ser mayores a 0', 'error');

        const ingredientes = [];
        let errorIng = false;
        document.querySelectorAll('.ingrediente-row').forEach(row => {
            const n = row.querySelector('.ing-nombre').value.trim();
            const c = parseFloat(row.querySelector('.ing-cant').value);
            const u = row.querySelector('.ing-unidad').value;
            if (!n || c <= 0 || isNaN(c)) errorIng = true;
            ingredientes.push({ nombre: n, cantidad: c, unidad: u });
        });

        if (errorIng) return showToast('Verifica las cantidades de los ingredientes', 'error');

        const receta = {
            id: id || Date.now().toString(),
            nombre, categoria, tiempo, dificultad, porciones, notas, ingredientes,
            fechaCreacion: id ? getRecetaById(id).fechaCreacion : new Date().toISOString(),
            favorito: id ? getRecetaById(id).favorito : false,
            historial: id ? getRecetaById(id).historial : []
        };

        if (id) {
            recetasGuardadas = recetasGuardadas.map(r => r.id === id ? receta : r);
            showToast('Receta actualizada', 'success');
        } else {
            recetasGuardadas.push(receta);
            showToast('Receta guardada exitosamente', 'success');
        }

        saveToLocalStorage();
        hideCrearReceta();
    });

    const llenarFormulario = (receta) => {
        document.getElementById('receta-id').value = receta.id;
        document.getElementById('receta-nombre').value = receta.nombre;
        document.getElementById('receta-categoria').value = receta.categoria;
        document.getElementById('receta-tiempo').value = receta.tiempo || '';
        document.getElementById('receta-dificultad').value = receta.dificultad;
        document.getElementById('receta-porciones').value = receta.porciones;
        document.getElementById('receta-notas').value = receta.notas || '';
        
        receta.ingredientes.forEach(ing => addIngredienteRow(ing.nombre, ing.cantidad, ing.unidad));
    };

    // Renderizar Mis Recetas
    const renderMisRecetas = () => {
        gridRecetas.innerHTML = '';
        let filtradas = [...recetasGuardadas];
        
        const q = buscarInput.value.toLowerCase();
        if (q) filtradas = filtradas.filter(r => r.nombre.toLowerCase().includes(q) || r.categoria.toLowerCase().includes(q));

        const sortMode = ordenarSelect.value;
        filtradas.sort((a, b) => {
            if (sortMode === 'fecha-desc') return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
            if (sortMode === 'fecha-asc') return new Date(a.fechaCreacion) - new Date(b.fechaCreacion);
            if (sortMode === 'nombre-asc') return a.nombre.localeCompare(b.nombre);
            if (sortMode === 'nombre-desc') return b.nombre.localeCompare(a.nombre);
            if (sortMode === 'porciones-desc') return b.porciones - a.porciones;
            return 0;
        });

        // Ordenar favoritos primero temporalmente si se quiere (opcional)
        filtradas.sort((a, b) => (a.favorito === b.favorito) ? 0 : a.favorito ? -1 : 1);

        totalRecetasSpan.textContent = recetasGuardadas.length;

        if (filtradas.length === 0) {
            gridRecetas.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fas fa-folder-open"></i>
                    <p>No se encontraron recetas.</p>
                </div>`;
            return;
        }

        filtradas.forEach(r => {
            const card = document.createElement('div');
            card.className = 'receta-card';
            const dateStr = new Date(r.fechaCreacion).toLocaleDateString();
            
            card.innerHTML = `
                <div class="receta-card-header">
                    <h4>${r.nombre}</h4>
                    <button class="btn-fav ${r.favorito ? 'active' : ''}" data-id="${r.id}"><i class="fas fa-star"></i></button>
                    <div class="badge-container">
                        <span class="badge cat"><i class="fas fa-tag"></i> ${r.categoria}</span>
                        ${r.dificultad ? `<span class="badge"><i class="fas fa-tachometer-alt"></i> ${r.dificultad}</span>` : ''}
                    </div>
                </div>
                <div class="receta-card-body">
                    <p><span><i class="fas fa-users"></i> Porciones:</span> <strong>${r.porciones}</strong></p>
                    <p><span><i class="fas fa-list-ul"></i> Ingredientes:</span> <strong>${r.ingredientes.length}</strong></p>
                    <p><span><i class="fas fa-clock"></i> Tiempo:</span> <strong>${r.tiempo ? r.tiempo+' min' : '--'}</strong></p>
                    <p><span><i class="far fa-calendar-alt"></i> Creado:</span> <strong>${dateStr}</strong></p>
                </div>
                <div class="receta-card-footer">
                    <button class="btn-icon open" data-id="${r.id}" title="Abrir/Escalar"><i class="fas fa-folder-open"></i></button>
                    <button class="btn-icon edit" data-id="${r.id}" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete" data-id="${r.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
                </div>
            `;
            gridRecetas.appendChild(card);
        });

        // Eventos Tarjetas
        document.querySelectorAll('.btn-fav').forEach(btn => btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const r = getRecetaById(id);
            r.favorito = !r.favorito;
            saveToLocalStorage();
        }));

        document.querySelectorAll('.btn-icon.delete').forEach(btn => btn.addEventListener('click', (e) => {
            if(confirm('¿Estás seguro de eliminar esta receta? Esta acción no se puede deshacer.')) {
                recetasGuardadas = recetasGuardadas.filter(r => r.id !== e.currentTarget.dataset.id);
                showToast('Receta eliminada', 'info');
                saveToLocalStorage();
            }
        }));

        document.querySelectorAll('.btn-icon.edit').forEach(btn => btn.addEventListener('click', (e) => {
            showCrearReceta(e.currentTarget.dataset.id);
        }));

        document.querySelectorAll('.btn-icon.open').forEach(btn => btn.addEventListener('click', (e) => {
            abrirFichaReceta(e.currentTarget.dataset.id);
        }));
    };

    buscarInput.addEventListener('input', renderMisRecetas);
    ordenarSelect.addEventListener('change', renderMisRecetas);

    // Inicialización de la vista
    if (recetasGuardadas.length === 0) showCrearReceta();
    else renderMisRecetas();


    // -----------------------------------------
    // 3. FICHA, ESCALADO E IMPRESIÓN
    // -----------------------------------------
    const modal = document.getElementById('recipe-modal');
    const modalClose = document.getElementById('modal-close');
    let recetaActualSeleccionada = null;

    const abrirFichaReceta = (id) => {
        recetaActualSeleccionada = getRecetaById(id);
        const r = recetaActualSeleccionada;
        
        document.getElementById('ficha-nombre').textContent = r.nombre;
        document.getElementById('ficha-categoria').innerHTML = `<i class="fas fa-tag"></i> ${r.categoria}`;
        document.getElementById('ficha-tiempo').innerHTML = `<i class="fas fa-clock"></i> ${r.tiempo ? r.tiempo+' min' : '--'}`;
        document.getElementById('ficha-dificultad').innerHTML = `<i class="fas fa-tachometer-alt"></i> ${r.dificultad}`;
        document.getElementById('ficha-porciones-orig').innerHTML = `<i class="fas fa-users"></i> ${r.porciones} porciones`;
        document.getElementById('ficha-notas-texto').textContent = r.notas || 'Sin observaciones.';
        document.getElementById('ficha-orig-num').textContent = r.porciones;
        
        // Render historial
        const histCont = document.getElementById('ficha-historial-lista');
        histCont.innerHTML = r.historial.length ? r.historial.map(h => `<li><span>Escalado: ${r.porciones} <i class="fas fa-arrow-right text-accent"></i> ${h.nuevas} pax</span> <span>${h.fecha}</span></li>`).join('') : '<li>No hay escalados previos.</li>';

        // Render Tabla Inicial
        renderTablaEscalada(r.ingredientes, 1);
        
        document.getElementById('nuevas-porciones').value = '';
        document.getElementById('imprimir-container').style.display = 'none';

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    modalClose.addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Acción Escalar desde el Modal
    const formEscalar = document.getElementById('escalar-guardada-form');
    formEscalar.addEventListener('submit', (e) => {
        e.preventDefault();
        const nuevas = parseFloat(document.getElementById('nuevas-porciones').value);
        const orig = recetaActualSeleccionada.porciones;

        if (nuevas <= 0) return showToast('Las porciones deben ser mayores a 0', 'error');

        const factor = nuevas / orig;
        renderTablaEscalada(recetaActualSeleccionada.ingredientes, factor);

        // Guardar en historial
        const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        recetaActualSeleccionada.historial.unshift({ nuevas, fecha: dateStr });
        if (recetaActualSeleccionada.historial.length > 5) recetaActualSeleccionada.historial.pop(); // Mantener solo últimos 5
        saveToLocalStorage();
        
        // Actualizar visual historial
        const histCont = document.getElementById('ficha-historial-lista');
        histCont.innerHTML = recetaActualSeleccionada.historial.map(h => `<li><span>Escalado: ${orig} <i class="fas fa-arrow-right text-accent"></i> ${h.nuevas} pax</span> <span>${h.fecha}</span></li>`).join('');

        // Mostrar boton imprimir
        document.getElementById('imprimir-container').style.display = 'flex';
        
        // Llenar layout de impresion oculto
        prepararImpresion(recetaActualSeleccionada, nuevas, factor);
    });

    const renderTablaEscalada = (ingredientes, factor) => {
        const tbody = document.getElementById('ficha-ingredientes-tabla');
        tbody.innerHTML = '';
        ingredientes.forEach(ing => {
            let nuevaCant = ing.cantidad * factor;
            let strNueva = nuevaCant % 1 === 0 ? nuevaCant : nuevaCant.toFixed(2);
            if (typeof strNueva === 'string' && strNueva.endsWith('.00')) strNueva = strNueva.slice(0, -3);

            tbody.innerHTML += `
                <tr>
                    <td>${ing.nombre}</td>
                    <td>${ing.cantidad} ${ing.unidad}</td>
                    <td class="col-escalada val-escalado">${strNueva} ${ing.unidad}</td>
                </tr>
            `;
        });
    };

    // Impresión
    const prepararImpresion = (receta, nuevasPorciones, factor) => {
        document.getElementById('print-nombre').textContent = receta.nombre;
        document.getElementById('print-categoria').textContent = receta.categoria;
        document.getElementById('print-originales').textContent = `${receta.porciones} personas`;
        document.getElementById('print-nuevas').textContent = `${nuevasPorciones} personas`;
        document.getElementById('print-factor').textContent = `${factor.toFixed(2)}x`;
        document.getElementById('print-fecha').textContent = new Date().toLocaleString();
        
        const ptbody = document.getElementById('print-tbody');
        ptbody.innerHTML = '';
        receta.ingredientes.forEach(ing => {
            let nueva = ing.cantidad * factor;
            let strN = nueva % 1 === 0 ? nueva : nueva.toFixed(2);
            ptbody.innerHTML += `<tr><td>${ing.nombre}</td><td>${ing.cantidad}</td><td>${strN}</td><td>${ing.unidad}</td></tr>`;
        });

        if (receta.notas) {
            document.getElementById('print-notas').textContent = receta.notas;
            document.getElementById('print-notas-container').style.display = 'block';
        } else {
            document.getElementById('print-notas-container').style.display = 'none';
        }
    };

    document.getElementById('btn-imprimir').addEventListener('click', () => {
        window.print();
    });


    // -----------------------------------------
    // 4. CONVERSOR AVANZADO
    // -----------------------------------------
    const convForm = document.getElementById('conversor-form');
    const tabBtns = document.querySelectorAll('#conversor .tab-btn');
    const selOrigen = document.getElementById('conv-origen');
    const selDestino = document.getElementById('conv-destino');
    const swapBtnConv = document.getElementById('swap-units');
    
    let modoConv = 'masa';

    // Mapas de conversión respecto a unidad base
    const rates = {
        masa: { base: 'g', dict: { mg: 0.001, g: 1, kg: 1000, oz: 28.3495, lb: 453.592 } },
        volumen: { base: 'ml', dict: { ml: 1, l: 1000, cup: 240, tbsp: 15, tsp: 5, floz: 29.5735, pt: 473.176, qt: 946.353, gal: 3785.41 } }
    };

    const opsMasa = `<option value="mg">Miligramos (mg)</option><option value="g" selected>Gramos (g)</option><option value="kg">Kilogramos (kg)</option><option value="oz">Onzas (oz)</option><option value="lb">Libras (lb)</option>`;
    const opsVol = `<option value="ml" selected>Mililitros (ml)</option><option value="l">Litros (L)</option><option value="cup">Tazas (cup)</option><option value="tbsp">Cucharadas (tbsp)</option><option value="tsp">Cucharaditas (tsp)</option><option value="floz">Onzas Líq. (fl oz)</option><option value="pt">Pintas (pt)</option><option value="qt">Cuartos (qt)</option><option value="gal">Galones (gal)</option>`;
    const opsTemp = `<option value="c" selected>Celsius (°C)</option><option value="f">Fahrenheit (°F)</option><option value="k">Kelvin (K)</option>`;

    const changeConvTab = (modo) => {
        modoConv = modo;
        if (modo === 'masa') { selOrigen.innerHTML = opsMasa; selDestino.innerHTML = opsMasa; selDestino.value = 'oz'; }
        if (modo === 'volumen') { selOrigen.innerHTML = opsVol; selDestino.innerHTML = opsVol; selDestino.value = 'cup'; }
        if (modo === 'temperatura') { selOrigen.innerHTML = opsTemp; selDestino.innerHTML = opsTemp; selDestino.value = 'f'; }
        document.getElementById('conversor-resultado').classList.add('hidden');
    };

    changeConvTab('masa'); // init

    tabBtns.forEach(btn => btn.addEventListener('click', (e) => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        changeConvTab(btn.dataset.tab);
    }));

    swapBtnConv.addEventListener('click', () => {
        let t = selOrigen.value; selOrigen.value = selDestino.value; selDestino.value = t;
    });

    convForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const cant = parseFloat(document.getElementById('conv-cantidad').value);
        const o = selOrigen.value;
        const d = selDestino.value;

        if (cant < 0 && modoConv !== 'temperatura') return showToast("Masa/Volumen no puede ser negativo.", "error");
        if (o === d) return showToast("Selecciona unidades distintas.", "error");

        let res = 0;
        if (modoConv === 'masa' || modoConv === 'volumen') {
            // formula: cant * (rateO / rateBase) / (rateD / rateBase)  => cant * rateO / rateD
            const dict = rates[modoConv].dict;
            res = cant * (dict[o] / dict[d]);
        } else {
            // temp
            if (o==='c' && d==='f') res = (cant * 9/5)+32;
            else if (o==='c' && d==='k') res = cant + 273.15;
            else if (o==='f' && d==='c') res = (cant - 32) * 5/9;
            else if (o==='f' && d==='k') res = (cant - 32) * 5/9 + 273.15;
            else if (o==='k' && d==='c') res = cant - 273.15;
            else if (o==='k' && d==='f') res = (cant - 273.15) * 9/5 + 32;
        }

        let fRes = res % 1 === 0 ? res : res.toFixed(3); // Mayor precision en conversor puro
        document.getElementById('conv-res-from').textContent = `${cant} ${o.toUpperCase()}`;
        document.getElementById('conv-res-to').textContent = `${fRes} ${d.toUpperCase()}`;
        document.getElementById('conversor-resultado').classList.remove('hidden');
    });

    // -----------------------------------------
    // 5. SLIDER DE FÓRMULAS
    // -----------------------------------------
    const slider = document.getElementById('formulas-slider');
    const btnL = document.getElementById('slider-left');
    const btnR = document.getElementById('slider-right');

    const scrollAmount = 300;
    btnL.addEventListener('click', () => slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' }));
    btnR.addEventListener('click', () => slider.scrollBy({ left: scrollAmount, behavior: 'smooth' }));

});
